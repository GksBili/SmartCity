import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import useLocation from "../hooks/useLocation";
import {
  fetchNearbyGooglePlaces,
  buildPlacePhotoUrl,
} from "../services/googlePlacesService";
import { savePlace, getSavedPlaces } from "../services/savedPlacesService";

export default function MapScreen() {
  const { location, errorMsg } = useLocation();
  const [currentPlace, setCurrentPlace] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  async function loadExistingSavedPlaces() {
    try {
      const saved = await getSavedPlaces();
      const ids = new Set(saved.map((place) => place.placeId));
      setSavedIds(ids);
    } catch (error) {
      console.log("Load saved ids error:", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadExistingSavedPlaces();
    }, []),
  );

  async function loadMapData(showRefreshState = false) {
    if (!location?.coords) return;

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoadingPlaces(true);
      }

      const { latitude, longitude } = location.coords;

      const reverse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const first = reverse[0];

      const currentLocationName = first
        ? `${first.name || first.street || "Current Location"}${
            first.city ? `, ${first.city}` : ""
          }`
        : "Current Location";

      const currentAddress = first
        ? `${first.street || ""} ${first.city || ""} ${first.region || ""}`.trim()
        : "Your current location";

      setCurrentPlace({
        id: "current-location",
        placeId: "current-location",
        name: currentLocationName,
        address: currentAddress,
        category: "current location",
        lat: latitude,
        lng: longitude,
        photoUrl: null,
      });

      const places = await fetchNearbyGooglePlaces(latitude, longitude);

      const withPhotos = places.map((place) => ({
        ...place,
        photoUrl: buildPlacePhotoUrl(place.photoName),
      }));

      setNearbyPlaces(withPhotos);
    } catch (error) {
      console.log("Map data load error:", error.message);
      Alert.alert("Refresh failed", error.message);
    } finally {
      setLoadingPlaces(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (location?.coords) {
      loadMapData();
    }
  }, [location]);

  const allMarkers = useMemo(() => {
    const markers = [];
    if (currentPlace) markers.push(currentPlace);
    return [...markers, ...nearbyPlaces];
  }, [currentPlace, nearbyPlaces]);

  async function handleSave(place) {
    try {
      setSavingId(place.id);

      await savePlace({
        placeId: place.placeId || place.id,
        name: place.name,
        address: place.address,
        category: place.category,
        lat: place.lat,
        lng: place.lng,
        photoUrl: place.photoUrl || "",
      });

      setSavedIds((prev) => {
        const updated = new Set(prev);
        updated.add(place.placeId || place.id);
        return updated;
      });

      Alert.alert("Saved", `${place.name} was saved to Firestore.`);
    } catch (error) {
      Alert.alert("Save failed", error.message);
    } finally {
      setSavingId(null);
    }
  }

  function renderSaveButton(item) {
    const itemKey = item.placeId || item.id;
    const isSaved = savedIds.has(itemKey);
    const isSaving = savingId === item.id;

    return (
      <TouchableOpacity
        style={[styles.saveButton, isSaved && styles.savedButton]}
        onPress={() => handleSave(item)}
        disabled={isSaved || isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaved ? "Saved" : isSaving ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading map...</Text>
      </View>
    );
  }

  const { latitude, longitude } = location.coords;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {allMarkers.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            title={place.name}
            description={place.category}
          />
        ))}
      </MapView>

      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.sheetTitle}>Places Around You</Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadMapData(true)}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {loadingPlaces ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : (
          <FlatList
            data={[currentPlace, ...nearbyPlaces].filter(Boolean)}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.placeholderText}>No Photo</Text>
                  </View>
                )}

                <View style={styles.textWrap}>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeCategory}>
                    {(item.category || "place").replace(/_/g, " ")}
                  </Text>
                  <Text style={styles.placeAddress}>{item.address}</Text>
                  {renderSaveButton(item)}
                </View>
              </View>
            )}
            ListEmptyComponent={<Text>No nearby places found.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  sheet: {
    maxHeight: 360,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  refreshButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  savedButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
