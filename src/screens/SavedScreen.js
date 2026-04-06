import { useCallback, useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../components/ThemeContext";
import {
  getSavedPlaces,
  removeSavedPlace,
} from "../services/savedPlacesService";

export default function SavedScreen() {
  const { theme } = useTheme();
  const [places, setPlaces] = useState([]);

  async function loadPlaces() {
    try {
      const data = await getSavedPlaces();
      setPlaces(data);
    } catch (error) {
      console.log("Load saved places error:", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [])
  );

  async function handleDelete(id) {
    try {
      await removeSavedPlace(id);
      await loadPlaces();
    } catch (error) {
      Alert.alert("Delete failed", error.message);
    }
  }

  async function handleDirections(place) {
    try {
      const appUrl = `comgooglemaps://?daddr=${place.lat},${place.lng}&directionsmode=driving`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) await Linking.openURL(appUrl);
      else await Linking.openURL(webUrl);
    } catch (error) {
      Alert.alert("Directions failed", error.message);
    }
  }

  function renderPhoto(photoUrl) {
    if (photoUrl) return <Image source={{ uri: photoUrl }} style={styles.photo} />;
    return (
      <View style={[styles.photo, styles.photoPlaceholder]}>
        <Text style={styles.placeholderText}>No Photo</Text>
      </View>
    );
  }

  function getGroupLabel(place) {
    const address = (place.address || "").trim();
    if (!address) return "Places around Other Locations";

    const parts = address
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return "Places around Other Locations";

    const country = parts[parts.length - 1];
    let city = "";
    if (parts.length >= 2) city = parts[1];
    if (!city && parts.length >= 3) city = parts[parts.length - 3];
    if (!city && parts.length >= 2) city = parts[0];

    return country.toLowerCase() === "canada"
      ? `Places around ${city || "Canada"}`
      : `Places around ${city || country}, ${country}`;
  }

  const groupedSections = useMemo(() => {
    const grouped = {};
    for (const place of places) {
      const label = getGroupLabel(place);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(place);
    }
    return Object.keys(grouped)
      .sort()
      .map((title) => ({ title, data: grouped[title] }));
  }, [places]);

  // ------------------ Theme based styling ------------------
  const cardStyle =
    theme === "weather"
      ? [styles.card, { backgroundColor: "#0f63b1" }]
      : styles.card;

  const textColor = theme === "weather" ? "#fff" : "#222";
  const titleColor = theme === "weather" ? "#222" : "#222"; 
  const sectionTitleColor = theme === "weather" ? "#222" : "#222"; 
  const categoryColor = theme === "weather" ? "#ccc" : "#555";
  const addressColor = theme === "weather" ? "#ccc" : "#666";

  const Container = theme === "weather" ? LinearGradient : View;
  const containerProps =
    theme === "weather"
      ? { colors: ["#b1e6f7", "#019cf0"], style: styles.container }
      : { style: styles.container };

  return (
    <Container {...containerProps}>
      <Text style={[styles.title, { color: titleColor }]}>Saved Places</Text>

      {groupedSections.length === 0 ? (
        <Text style={{ color: textColor }}>No saved places yet.</Text>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={cardStyle}>
              {renderPhoto(item.photoUrl)}
              <View style={styles.textWrap}>
                <Text style={[styles.placeName, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.placeCategory, { color: categoryColor }]}>
                  {(item.category || "place").replace(/_/g, " ")}
                </Text>
                <Text style={[styles.placeAddress, { color: addressColor }]}>{item.address}</Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => handleDirections(item)}
                  >
                    <Text style={styles.buttonText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#ededed",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 12,
  },
  textWrap: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  placeCategory: {
    fontSize: 13,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  placeAddress: {
    fontSize: 13,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  directionsButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});