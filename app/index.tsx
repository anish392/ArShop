// index.tsx
import React from "react";
import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStackNavigator from "../components/navigation/AuthStackNavigator";
import { getAuth } from "@firebase/auth";
import { Splash } from "./screens/splash";
import { preventAutoHideAsync } from "expo-splash-screen";
preventAutoHideAsync();

const appName = "ArShop";
function App() {
  const [splashComplete, setStaplashCoplete] = useState(false);
  return splashComplete ? (
    <AuthStackNavigator />
  ) : (
    <Splash onComplete={setStaplashCoplete} />
  );
}

export default App;
