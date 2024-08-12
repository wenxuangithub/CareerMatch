import React, { useContext } from "react";
import { getApps, initializeApp } from "firebase/app";
import { AuthContext } from "../provider/AuthProvider";
import { NavigationContainer } from "@react-navigation/native";
import Main from "./MainStack";
import Auth from "./AuthStack";
import Loading from "../screens/utils/Loading";

// Import environment variables
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from "@env";

// Firebase configuration object using environment variables
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Initialize Firebase if it hasn't been initialized yet
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

// Main component for navigation
const AppNavigation = () => {
  const auth = useContext(AuthContext);
  const user = auth.user;

  return (
    <NavigationContainer>
      {user === null && <Loading />}
      {user === false && <Auth />}
      {user === true && <Main />}
    </NavigationContainer>
  );
};

export default AppNavigation;