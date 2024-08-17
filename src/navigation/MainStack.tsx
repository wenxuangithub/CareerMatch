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
      <MainStack.Screen name="EditStudentProfile" component={EditStudentProfile} />
    </MainStack.Navigator>
  );
};

export default Main;
