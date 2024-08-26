import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { themeColor, useTheme } from "react-native-rapi-ui";
import TabBarIcon from "../components/utils/TabBarIcon";
import TabBarText from "../components/utils/TabBarText";

import Home from "../screens/employer/EmployerHome";
import Notification from "../Notification";
import QRScanner from "../components/tools/QRScanner";
import Profile from "../screens/student/Profile";

const Tabs = createBottomTabNavigator();
const EmployerTabs = () => {
  const { isDarkmode } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopColor: isDarkmode ? themeColor.dark100 : "#c0c0c0",
          backgroundColor: isDarkmode ? themeColor.dark200 : "#ffffff",
        },
      }}
    >
      {/* these icons using Ionicons */}
      <Tabs.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: ({ focused }) => (
            <TabBarText focused={focused} title="" />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={"accessibility"} />
          ),
        }}
      />
      <Tabs.Screen
        name="Scan"
        component={QRScanner}
        options={{
          tabBarLabel: ({ focused }) => (
            <TabBarText focused={focused} title="" />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={"scan-sharp"} />
          ),
        }}
      />
      <Tabs.Screen
        name="Notification"
        component={Notification}
        options={{
          tabBarLabel: ({ focused }) => (
            <TabBarText focused={focused} title="" />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={"notifications"} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: ({ focused }) => (
            <TabBarText focused={focused} title="" />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={"person"} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
};

export default EmployerTabs;
