import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../services/firebaseConfig";
import { logoutUser } from "../services/authService";

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [theme, setTheme] = useState("light"); // 默认主题 light

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.log(error.message);
    }
  }

  function toggleTheme(selectedTheme) {
    setTheme(selectedTheme);
  }

  // 根据主题设置样式
  const themeStyles = theme === "dark" ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Text style={[styles.title, themeStyles.title]}>Profile</Text>
      <Text style={[styles.info, themeStyles.info]}>Email: {user?.email}</Text>

      <Text style={[styles.label, themeStyles.label]}>Select Theme:</Text>
      <View style={styles.themeRow}>
        <TouchableOpacity
          style={[
            styles.themeButton,
            theme === "light" && themeStyles.selectedThemeButton,
          ]}
          onPress={() => toggleTheme("light")}
        >
          <Text style={themeStyles.buttonText}>Light</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeButton,
            theme === "weather" && themeStyles.selectedThemeButton,
          ]}
          onPress={() => toggleTheme("weather")}
        >
          <Text style={themeStyles.buttonText}>Weather</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, themeStyles.button]} onPress={handleLogout}>
        <Text style={[styles.buttonText, themeStyles.buttonText]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  themeRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  themeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  selectedThemeButton: {
    backgroundColor: "#666",
  },
  button: {
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "600",
  },
});

const lightStyles = StyleSheet.create({
  container: { backgroundColor: "#f7f7f7" },
  title: { color: "#222" },
  info: { color: "#333" },
  label: { color: "#222" },
  button: { backgroundColor: "#222" },
  buttonText: { color: "#fff" },
  selectedThemeButton: { backgroundColor: "#555" },
});


const weatherStyles = StyleSheet.create({
  container: { backgroundColor: "#a0c4ff" },
  title: { color: "#003566" },
  info: { color: "#001845" },
  label: { color: "#003566" },
  button: { backgroundColor: "#005f73" },
  buttonText: { color: "#fff" },
  selectedThemeButton: { backgroundColor: "#0a9396" },
});
