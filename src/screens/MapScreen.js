import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import useLocation from "../hooks/useLocation";
import {
  fetchNearbyGooglePlaces,
  buildPlacePhotoUrl,
} from "../services/googlePlacesService";
import { savePlace, getSavedPlaces } from "../services/savedPlacesService";

function formatCategory(category) {
  if (!category) return "Place";
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRating(rating) {
  if (typeof rating !== "number") return "N/A";
  return rating.toFixed(1);
}

export default function MapScreen() {
  const { location, errorMsg } = useLocation();
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [currentPlace, setCurrentPlace] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);

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

  async function loadMapData(showRefreshState = false, customCenter = null) {
    const targetCenter =
      customCenter ||
      mapCenter ||
      (location?.coords
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        : null);

    if (!targetCenter) return;

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoadingPlaces(true);
      }

      const { latitude, longitude } = targetCenter;

      const reverse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const first = reverse[0];
      const centerName = first?.city || first?.region || "Selected Area";
      const centerAddress = first
        ? `${first.street || ""} ${first.city || ""} ${first.region || ""}`.trim()
        : "Map center location";

      setCurrentPlace({
        id: "map-center",
        placeId: `map-center-${latitude}-${longitude}`,
        name: centerName,
        address: centerAddress,
        category: "map center",
        lat: latitude,
        lng: longitude,
        photoUrl: null,
        rating: null,
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
      setMapMoved(false);
    }
  }

  async function resetToUserLocation() {
    if (!location?.coords) return;

    const userCenter = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setSearchQuery("");
    setSearching(false);
    setMapMoved(false);
    setCurrentPlace(null);
    setNearbyPlaces([]);
    setMapCenter(userCenter);

    mapRef.current?.animateToRegion(
      {
        latitude: userCenter.latitude,
        longitude: userCenter.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      800,
    );

    await loadMapData(false, userCenter);
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      if (navigation.isFocused()) {
        resetToUserLocation();
      }
    });

    return unsubscribe;
  }, [navigation, location]);

  async function handleSearch() {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      Alert.alert("Missing search", "Please enter a city, landmark, or place.");
      return;
    }

    try {
      Keyboard.dismiss();
      setSearching(true);

      const results = await Location.geocodeAsync(trimmed);

      if (!results.length) {
        Alert.alert("No results", "Could not find that location.");
        return;
      }

      const first = results[0];

      const region = {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      const newCenter = {
        latitude: first.latitude,
        longitude: first.longitude,
      };

      setMapCenter(newCenter);
      mapRef.current?.animateToRegion(region, 800);
      await loadMapData(false, newCenter);
    } catch (error) {
      Alert.alert("Search failed", error.message);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (location?.coords && !mapCenter) {
      const initialCenter = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMapCenter(initialCenter);
      loadMapData(false, initialCenter);
    }
  }, [location]);

  const allMarkers = useMemo(() => {
    return [currentPlace, ...nearbyPlaces].filter(Boolean);
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

  function renderPlaceCard(item) {
    return (
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

          <View style={styles.metaRow}>
            <Text style={styles.placeCategory}>
              {formatCategory(item.category)}
            </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>
                  {formatRating(item.rating)}
                </Text>

                {typeof item.rating === "number" && (
                  <Ionicons name="star" size={14} color="#f5c518" />
                )}
            </View>
          </View>

          <Text style={styles.placeAddress}>{item.address}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => handleDirections(item)}
            >
              <Text style={styles.buttonText}>Directions</Text>
            </TouchableOpacity>

            {renderSaveButton(item)}
          </View>
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location || !mapCenter) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchOverlay}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search a city or place"
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          <Text style={styles.searchButtonText}>
            {searching ? "..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        onRegionChangeComplete={(region) => {
          const newCenter = {
            latitude: region.latitude,
            longitude: region.longitude,
          };

          const movedEnough =
            !mapCenter ||
            Math.abs(newCenter.latitude - mapCenter.latitude) > 0.001 ||
            Math.abs(newCenter.longitude - mapCenter.longitude) > 0.001;

          if (movedEnough) {
            setMapMoved(true);
          }

          setMapCenter(newCenter);
        }}
      >
        {allMarkers.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            title={place.name}
            description={formatCategory(place.category)}
          />
        ))}
      </MapView>

      <View style={styles.centerPinWrap} pointerEvents="none">
        <View style={styles.centerPin} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {`Places around ${currentPlace?.name || "Map Center"}`}
          </Text>

          <TouchableOpacity
            style={[
              styles.refreshButton,
              mapMoved && styles.refreshButtonActive,
            ]}
            onPress={() => loadMapData(true)}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing
                ? "Refreshing..."
                : mapMoved
                  ? "Refresh Area"
                  : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {loadingPlaces ? (
          <ActivityIndicator style={styles.loadingList} />
        ) : (
          <FlatList
            data={[currentPlace, ...nearbyPlaces].filter(Boolean)}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => renderPlaceCard(item)}
            ListEmptyComponent={<Text>No nearby places found.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },

  searchOverlay: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    color: "#222",
  },
  searchButton: {
    backgroundColor: "#222",
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  centerPinWrap: {
    position: "absolute",
    top: "28%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  centerPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#d9534f",
    borderWidth: 3,
    borderColor: "#fff",
  },

  sheet: {
    maxHeight: 380,
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
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButtonActive: {
    backgroundColor: "#4CAF50",
  },
  refreshButtonText: {
    color: "#fff",
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
    marginBottom: 4,
    color: "#111",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  placeCategory: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    textTransform: "capitalize",
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#667",
  },
  placeAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  directionsButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
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
    color: "#fff",
    fontWeight: "600",
  },

  loadingList: {
    marginTop: 12,
  },
  loadingText: {
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
