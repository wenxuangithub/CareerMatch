import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { ActivityIndicator, View } from "react-native";

import MainTabs from "./MainTabs";
import EmployerTabs from "./EmployerTabs";
import AdminTabs from "./AdminTabs";
import StudentProfile from "../screens/student/Profile";
import EditStudentProfile from "../screens/student/EditStudentProfile";
import Template from "../template";
import DigitalCard from "../DigitalCard";
import EditDigitalCard from "../EditDigitalCard";
import WebView from "../WebView";
import QRScanner from "../components/tools/QRScanner";
import SavedCards from "../SavedCards";

const MainStack = createNativeStackNavigator();

const Main = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const auth = getAuth();
      const db = getFirestore();

      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "user", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {userRole === "student" && (
        <MainStack.Screen name="MainTabs" component={MainTabs} />
      )}
      {userRole === "employer" && (
        <MainStack.Screen name="EmployerTabs" component={EmployerTabs} />
      )}
      {userRole === "admin" && (
        <MainStack.Screen name="AdminTabs" component={AdminTabs} />
      )}
      <MainStack.Screen name="StudentProfile" component={StudentProfile} />
      <MainStack.Screen
        name="EditStudentProfile"
        component={EditStudentProfile}
      />
      <MainStack.Screen name="Template" component={Template} />
      <MainStack.Screen name="EditDigitalCard" component={EditDigitalCard} />
      <MainStack.Screen name="DigitalCard" component={DigitalCard} />
      <MainStack.Screen name="WebView" component={WebView} />
      <MainStack.Screen name="SavedCards" component={SavedCards} />
      <MainStack.Screen name="QRScanner" component={QRScanner} />
    </MainStack.Navigator>
  );
};

//<MainStack.Screen name="" component={} />
export default Main;
