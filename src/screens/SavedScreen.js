import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getSavedPlaces,
  removeSavedPlace,
} from "../services/savedPlacesService";

export default function SavedScreen() {
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
    }, []),
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

      if (canOpenApp) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert("Directions failed", error.message);
    }
  }

  function renderPhoto(photoUrl) {
    if (photoUrl) {
      return <Image source={{ uri: photoUrl }} style={styles.photo} />;
    }

    return (
      <View style={[styles.photo, styles.photoPlaceholder]}>
        <Text style={styles.placeholderText}>No Photo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Places</Text>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text>No saved places yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {renderPhoto(item.photoUrl)}

            <View style={styles.textWrap}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeCategory}>
                {(item.category || "place").replace(/_/g, " ")}
              </Text>
              <Text style={styles.placeAddress}>{item.address}</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f4f4f4",
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
    color: "#555",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  placeAddress: {
    fontSize: 13,
    color: "#666",
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
