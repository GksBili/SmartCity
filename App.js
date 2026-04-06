import { NavigationContainer } from "@react-navigation/native"; 
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/components/ThemeContext"; 

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}