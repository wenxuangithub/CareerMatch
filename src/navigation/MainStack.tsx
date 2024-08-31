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
import Notification from "../Notification";
import EventCreation from "../screens/admin/EventCreation";
import EventRegistration from "../screens/employer/EventRegistration";
import EventListForRegistration from "../screens/employer/EventListForRegistration";
import AdminEventList from "../screens/admin/AdminEventList";
import AdminEventPanel from "../screens/admin/AdminEventPanel";
import EmployerEventList from "../screens/employer/EmployerEventList";
import EmployerEventPanel from "../screens/employer/EmployerEventPanel";
import DocumentsQR from "../screens/employer/DocumentsQR";
import EventCompanyInfo from "../EventCompanyInfo";
import JobDetails from "../JobDetails";
import EventList from "../screens/student/EventList";
import EventInfo from "../screens/student/EventInfo";
import BrowseJobList from "../screens/student/BrowseJobList";
import AIJobRecommendation from "../screens/student/AIJobRecommendations";
import EventEdit from "../screens/admin/EventEdit";
import ApplicationDetails from "../screens/admin/ApplicationDetails";
import AttendanceFeature from "../screens/admin/AttendanceFeature";


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
      <MainStack.Screen name="Notification" component={Notification} />
      <MainStack.Screen name="EventCreation" component={EventCreation} />
      <MainStack.Screen name="EventRegistration" component={EventRegistration} />
      <MainStack.Screen name="EventListForRegistration" component={EventListForRegistration} />
      <MainStack.Screen name="AdminEventList" component={AdminEventList} />
      <MainStack.Screen name="AdminEventPanel" component={AdminEventPanel} />
      <MainStack.Screen name="EmployerEventList" component={EmployerEventList} />
      <MainStack.Screen name="EmployerEventPanel" component={EmployerEventPanel} />
      <MainStack.Screen name="DocumentsQR" component={DocumentsQR} />
      <MainStack.Screen name="EventCompanyInfo" component={EventCompanyInfo} />
      <MainStack.Screen name="JobDetails" component={JobDetails} />
      <MainStack.Screen name="EventList" component={EventList} />
      <MainStack.Screen name="EventInfo" component={EventInfo} />
      <MainStack.Screen name="BrowseJobList" component={BrowseJobList} />
      <MainStack.Screen name="AIJobRecommendation" component={AIJobRecommendation} />
      <MainStack.Screen name="ApplicationDetails" component={ApplicationDetails} />
      <MainStack.Screen name="EventEdit" component={EventEdit} />
      <MainStack.Screen name="AttendanceFeature" component={AttendanceFeature} />
    
    
    </MainStack.Navigator>
  );
};

//<MainStack.Screen name="" component={} />
export default Main;
