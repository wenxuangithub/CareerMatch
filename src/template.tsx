import React from "react";
import { View, Linking } from "react-native";
import { MainStackParamList } from "./types/navigation";
import { getAuth, signOut } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  Button,
  Text,
  TopNav,
  Section,
  SectionContent,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "Template">) {
  const { isDarkmode, setTheme } = useTheme();
  const auth = getAuth();
  return (
    <Layout>
    <TopNav
      middleContent="" //This is the top middle part for the page name
      rightContent={
        "" //This is the top right side
      }
      rightAction={() => {
         //This is the part for right action
      }}
      leftContent={
        "" //This is the top left side, usually will be use for Back button
      }
      leftAction={() => {
        //This is the part for left action
      }}
    />
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
    
    </View>
  </Layout>
    );

}
