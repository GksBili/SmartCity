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
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../components/ThemeContext";
import useLocation from "../hooks/useLocation";
import {
  fetchNearbyGooglePlaces,
  buildPlacePhotoUrl,
} from "../services/googlePlacesService";
import { savePlace, getSavedPlaces } from "../services/savedPlacesService";


function formatCategory(category) {
  if (!category) return "Place";
  return category.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRating(rating) {
  if (typeof rating !== "number") return "N/A";
  return rating.toFixed(1);
}

export default function MapScreen() {
  const { theme } = useTheme();
  const { location, errorMsg } = useLocation();
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const isWeatherMode = theme === "weather";


  const themeStyles = isWeatherMode
    ? {
        sheet: { backgroundColor: "#00aacd" },
        button: { backgroundColor: "#003566" },
        card: { backgroundColor: "rgba(255,255,255,0.2)" },
        title: { color: "#222" },
        bodyText: { color: "#222" },
        placeholder: "#222"
      }
    : {
        sheet: { backgroundColor: "#fff" },
        button: { backgroundColor: "#222" },
        card: { backgroundColor: "#f4f4f4" },
        title: { color: "#222" },
        bodyText: { color: "#111" },
        placeholder: "#777"
      };

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
    } catch (error) { console.log(error.message); }
  }

  useFocusEffect(useCallback(() => { loadExistingSavedPlaces(); }, []));

  async function handleDirections(place) {
    if (!place?.lat || !place?.lng) return;
    try {
      const appUrl = `comgooglemaps://?daddr=${place.lat},${place.lng}&directionsmode=driving`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) await Linking.openURL(appUrl);
      else await Linking.openURL(webUrl);
    } catch (error) { Alert.alert("Directions failed", error.message); }
  }

  async function loadMapData(showRefreshState = false, customCenter = null) {
    const targetCenter = customCenter || mapCenter;
    if (!targetCenter?.latitude) return;
    try {
      if (showRefreshState) setRefreshing(true); else setLoadingPlaces(true);
      const { latitude, longitude } = targetCenter;
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = reverse[0];
      const centerName = first?.city || first?.region || "Selected Area";
      const centerAddress = first ? `${first.street || ""} ${first.city || ""} ${first.region || ""}`.trim() : "Map center location";
      setCurrentPlace({ id: "map-center", placeId: `map-center-${latitude}-${longitude}`, name: centerName, address: centerAddress, category: "map center", lat: latitude, lng: longitude, photoUrl: null, rating: null });
      const places = await fetchNearbyGooglePlaces(latitude, longitude);
      const withPhotos = places.map((place) => ({ ...place, photoUrl: buildPlacePhotoUrl(place.photoName) }));
      setNearbyPlaces(withPhotos);
    } catch (error) { console.log(error.message); } finally { setLoadingPlaces(false); setRefreshing(false); setMapMoved(false); }
  }

  async function handleSearch() {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    try {
      Keyboard.dismiss();
      setSearching(true);
      const results = await Location.geocodeAsync(trimmed);
      if (!results.length) { Alert.alert("No results", "Location not found."); return; }
      const first = results[0];
      const newCenter = { latitude: first.latitude, longitude: first.longitude };
      setMapCenter(newCenter);
      mapRef.current?.animateToRegion({ ...newCenter, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      await loadMapData(false, newCenter);
    } catch (error) { Alert.alert("Search error", error.message); } finally { setSearching(false); }
  }

  useEffect(() => {
    if (location?.coords && !mapCenter) {
      const initial = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setMapCenter(initial);
      loadMapData(false, initial);
    }
  }, [location]);

  async function handleSave(place) {
    try {
      setSavingId(place.id);
      await savePlace({ placeId: place.placeId || place.id, name: place.name, address: place.address, category: place.category, lat: place.lat, lng: place.lng, photoUrl: place.photoUrl || "" });
      setSavedIds((prev) => new Set(prev).add(place.placeId || place.id));
      Alert.alert("Saved", `${place.name} saved.`);
    } catch (error) { Alert.alert("Save failed", error.message); } finally { setSavingId(null); }
  }

  const allMarkers = useMemo(() => [currentPlace, ...nearbyPlaces].filter(p => p && p.lat && p.lng), [currentPlace, nearbyPlaces]);

  
  function renderMainUI() {
    return (
      <>
        <View style={[styles.searchOverlay, { top: Platform.OS === 'ios' ? 50 : 20 }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search a city or place"
            placeholderTextColor={themeStyles.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={[styles.searchButton, themeStyles.button]} onPress={handleSearch} disabled={searching}>
            <Text style={styles.searchButtonText}>{searching ? "..." : "Search"}</Text>
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapCenter ? { ...mapCenter, latitudeDelta: 0.02, longitudeDelta: 0.02 } : undefined}
          showsUserLocation
          onRegionChangeComplete={(region) => {
            const newCenter = { latitude: region.latitude, longitude: region.longitude };
            if (mapCenter && Math.abs(newCenter.latitude - mapCenter.latitude) > 0.001) setMapMoved(true);
            setMapCenter(newCenter);
          }}
        >
          {allMarkers.map((place) => (
            <Marker key={place.id} coordinate={{ latitude: place.lat, longitude: place.lng }} title={place.name} />
          ))}
        </MapView>

        <View style={styles.centerPinWrap} pointerEvents="none">
          <View style={styles.centerPin} />
        </View>

        <View style={[styles.sheet, themeStyles.sheet]}>
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, themeStyles.title]} numberOfLines={1}>
              {`Places around ${currentPlace?.name || "Center"}`}
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, themeStyles.button, mapMoved && styles.refreshButtonActive]}
              onPress={() => loadMapData(true)}
              disabled={refreshing}
            >
              <Text style={styles.refreshButtonText}>
                {refreshing ? "..." : mapMoved ? "Refresh Area" : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingPlaces ? (
            <ActivityIndicator style={styles.loadingList} color={isWeatherMode ? "#fff" : "#000"} />
          ) : (
            <FlatList
              data={[currentPlace, ...nearbyPlaces].filter(Boolean)}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.card, themeStyles.card]}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoPlaceholder]}>
                      <Text style={[styles.placeholderText, isWeatherMode && {color: '#fff'}]}>No Photo</Text>
                    </View>
                  )}
                  <View style={styles.textWrap}>
                    <Text style={[styles.placeName, themeStyles.title]}>{item.name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.placeCategory, themeStyles.bodyText]}>{formatCategory(item.category)}</Text>
                      <View style={styles.ratingRow}>
                        <Text style={[styles.ratingText, themeStyles.bodyText]}>{formatRating(item.rating)}</Text>
                        {typeof item.rating === "number" && <Ionicons name="star" size={14} color="#f5c518" />}
                      </View>
                    </View>
                    <Text style={[styles.placeAddress, themeStyles.bodyText, {opacity: 0.8}]}>{item.address}</Text>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={[styles.directionsButton, themeStyles.button]} onPress={() => handleDirections(item)}>
                        <Text style={styles.buttonText}>Directions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.saveButton, themeStyles.button, savedIds.has(item.placeId || item.id) && styles.savedButton]}
                        onPress={() => handleSave(item)}
                        disabled={savedIds.has(item.placeId || item.id) || savingId === item.id}
                      >
                        <Text style={styles.saveButtonText}>{savedIds.has(item.placeId || item.id) ? "Saved" : "Save"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </>
    );
  }

  if (errorMsg) return <View style={styles.center}><Text>{errorMsg}</Text></View>;
  if (!location || !mapCenter) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (isWeatherMode) {
    return (
      <LinearGradient colors={['#b1e6f7', "#019cf0"]} style={styles.container}>
        {renderMainUI()}
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {renderMainUI()}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchOverlay: {
    position: "absolute",
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
    elevation: 3,
    color: "#222",
  },
  searchButton: {
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
    top: "35%",
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
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  refreshButton: {
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
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  placeCategory: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
  },
  placeAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  directionsButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
