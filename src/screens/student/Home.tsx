import React from "react";
import { View, Linking } from "react-native";
import { MainStackParamList } from "../../types/navigation";
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
}: NativeStackScreenProps<MainStackParamList, "MainTabs">) {
  const { isDarkmode, setTheme } = useTheme();
  const auth = getAuth();
  return (
    <Layout>
      <TopNav
        middleContent="Home"
        rightContent={
          <Ionicons
            name={isDarkmode ? "sunny" : "moon"}
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => {
          if (isDarkmode) {
            setTheme("light");
          } else {
            setTheme("dark");
          }
        }}
      />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Section style={{ marginTop: 20 }}>
          <SectionContent>
            <Text fontWeight="bold" style={{ textAlign: "center" }}>
              These UI components provided by Rapi UI
            </Text>
            <Button
              text="Saved Cards"
              onPress={() => {
                navigation.navigate("SavedCards");
              }}
              style={{
                marginTop: 10,
              }}
            />
            <Button
              text="EventList"
              onPress={() => {
                navigation.navigate("EventList");
              }}
              style={{
                marginTop: 10,
              }}
            />
                        <Button
              text="AI Resume Builder"
              onPress={() => {
                navigation.navigate("AIResumeBuilder");
              }}
              style={{
                marginTop: 10,
              }}
            />
                                    <Button
              text="Resume Analysis"
              onPress={() => {
                navigation.navigate("ResumeAnalysis");
              }}
              style={{
                marginTop: 10,
              }}
            />
                                    <Button
              text="Resume Migration"
              onPress={() => {
                navigation.navigate("ResumeMigration");
              }}
              style={{
                marginTop: 10,
              }}
            />
            <Button
              status="danger"
              text="Logout"
              onPress={() => {
                signOut(auth);
              }}
              style={{
                marginTop: 10,
              }}
            />
          </SectionContent>
        </Section>
      </View>
    </Layout>
  );
}
