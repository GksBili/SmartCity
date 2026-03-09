import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Places</Text>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No saved places yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderText}>No Photo</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>
              <Text>{item.address}</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: "#666",
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  category: {
    color: "#666",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteText: {
    color: "white",
    fontWeight: "600",
  },
});
