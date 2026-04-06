import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../components/ThemeContext";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import SavedScreen from "../screens/SavedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlannerScreen from "../screens/PlannerScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {

  const { theme } = useTheme();
  const tabBarBackgroundColor = theme === "light" ? "#fff" : "#a0c4ff";
  const tabBarActiveTintColor = theme === "light" ? "#222" : "#003566";
  const tabBarInactiveTintColor = theme === "light" ? "gray" : "#555";

  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size, focused }) => {
        let iconName;

        if (route.name === "Home") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "Map") {
          iconName = focused ? "map" : "map-outline";
        } else if (route.name === "Saved") {
          iconName = focused ? "bookmark" : "bookmark-outline";
        } else if (route.name === "Planner") {
          iconName = focused ? "calendar" : "calendar-outline";
        } else if (route.name === "Profile") {
          iconName = focused ? "person" : "person-outline";
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },

      tabBarActiveTintColor: tabBarActiveTintColor,
      tabBarInactiveTintColor: tabBarInactiveTintColor,

      tabBarStyle: {
          height: 70,
          borderTopWidth: 0,
          backgroundColor: tabBarBackgroundColor,
        },
    })}
  >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
