import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useLocation from "../hooks/useLocation";
import { fetchWeather } from "../services/weatherService";
import { getLastWeather } from "../services/localStorage";
import { getRecommendation } from "../services/recommendationService";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function HomeScreen() {
  const { location, errorMsg } = useLocation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  );

  function getWeatherIcon(condition) {
    switch (condition?.toLowerCase()) {
      case "clear":
        return "sunny";
      case "clouds":
        return "cloudy";
      case "rain":
        return "rainy";
      case "snow":
        return "snow";
      case "thunderstorm":
        return "thunderstorm";
      default:
        return "partly-sunny";
    }
  }

  useEffect(() => {
    async function loadUser() {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        setName(snapshot.data().name);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadWeather() {
      if (!location && !errorMsg) return;

      try {
        if (location?.coords) {
          const data = await fetchWeather(
            location.coords.latitude,
            location.coords.longitude,
          );
          setWeather(data);
        } else {
          const cached = await getLastWeather();
          if (cached) setWeather(cached);
        }
      } catch (error) {
        console.log("Weather load error:", error.message);
        const cached = await getLastWeather();
        if (cached) setWeather(cached);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [location, errorMsg]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  const recommendation = weather
    ? getRecommendation(weather.condition, weather.temp)
    : null;
  const user = auth.currentUser;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart City</Text>
      <Text style={styles.subtitle}>Welcome back, {name}!</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {weather ? (
        <>
      <View style={styles.card}>
        <View style={styles.weatherRow}>

        <View style={{ flex: 1 }}>
          <View style={styles.cityTimeRow}>
            <Text style={styles.city} numberOfLines={1} ellipsizeMode="tail">
              {weather.city}
            </Text>
            <Text style={styles.time}>{currentTime}</Text>
          </View>

          <Text style={styles.temp}>{Math.round(weather.temp)}°C</Text>
          <Text style={styles.condition}>{weather.condition}</Text>
          <Text style={styles.description}>{weather.description}</Text>
        </View>

        <View style={styles.iconContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getWeatherIcon(weather.condition)} 
              size={100}                              
              color="grey"
              style={{ marginTop: 40 }}                         
            />
          </View>
        </View>

        </View>
      </View>

          {recommendation && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Today’s Recommendation</Text>

              <Text style={styles.label}>Summary</Text>
              <Text style={styles.bodyText}>{recommendation.summary}</Text>

              <Text style={styles.label}>What to wear</Text>
              <Text style={styles.bodyText}>{recommendation.clothing}</Text>

              <Text style={styles.label}>What to do</Text>
              <Text style={styles.bodyText}>{recommendation.activity}</Text>

              <Text style={styles.label}>Food / drink vibe</Text>
              <Text style={styles.bodyText}>{recommendation.foodDrink}</Text>

              <Text style={styles.label}>Mood</Text>
              <Text style={styles.bodyText}>{recommendation.mood}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Time: {recommendation.timeOfDay}
                </Text>
                <Text style={styles.metaText}>
                  Weather: {recommendation.weatherType}
                </Text>
                <Text style={styles.metaText}>
                  Temp: {recommendation.tempBand}
                </Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>No weather data yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#f7f7f7",
  },

  title:{
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle:{
    fontSize: 24,
    fontWeight: "500",
    marginBottom: 20,
    color:"grey",
  },

  card:{
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  /* -------- Weather Row -------- */
  weatherRow:{
    flexDirection: "row",
    alignItems: "center",
  },

  cityTimeRow:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4, 
  },

  city:{
    fontSize: 28,
    fontWeight: "700",
  },

  time:{
    fontSize: 20,
    fontWeight: "500",
    marginLeft: 8,
  },

  temp:{
    fontSize: 44,
    fontWeight: "700",
    marginVertical: 8,
  },

  condition:{
    fontSize: 18,
    fontWeight: "600",
  },

  description:{
    fontSize: 16,
    color: "#555",
    marginTop: 4,
    textTransform: "capitalize",
  },

  iconContainer:{
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop:15,
  },

  /* -------- Recommendation Card -------- */
  sectionTitle:{
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  label:{
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
    fontSize: 15,
  },
  bodyText:{
    fontSize: 15,
    lineHeight: 21,
    color: "#333",
  },
  metaRow: { 
    marginTop: 16, 
    gap: 6, 
  }, 
  metaText: { 
    fontSize: 13, 
    color: "#666", 
    textTransform: "capitalize", 
  }, 
  errorText: { 
    marginBottom: 12, 
    color: "#b00020", }, 
  emptyText: { 
    color: "#666", 
  },
});
