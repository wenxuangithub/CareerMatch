import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { getAuth, signOut } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
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

  // Define menu items
  const menuItems = [
    { name: "Saved Cards", icon: "bookmark", screen: "SavedCards" },
    { name: "Event List", icon: "calendar", screen: "EventList" },
    { name: "AI Resume Builder", icon: "create", screen: "AIResumeBuilder" },
    {
      name: "Interview Status",
      icon: "briefcase",
      screen: "StudentInterviewStatus",
    },
    { name: "Resume Analysis", icon: "analytics", screen: "ResumeAnalysis" },
    {
      name: "Resume Migration",
      icon: "arrow-forward",
      screen: "ResumeMigration",
    },
  ];

  return (
    <Layout>
      <TopNav
        middleContent="Student Hub"
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
      <ScrollView style={styles.container}>
        <Section style={styles.welcomeSection}>
          <SectionContent>
            <Text fontWeight="bold" style={styles.welcomeText}>
              Welcome to Student Hub
            </Text>
          </SectionContent>
        </Section>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() =>
                navigation.navigate(item.screen as keyof MainStackParamList)
              }
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isDarkmode ? themeColor.white100 : themeColor.dark}
              />
              <Text style={styles.menuItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => signOut(auth)}
        >
          <Ionicons name="log-out" size={24} color={themeColor.danger} />
          <Text style={[styles.menuItemText, { color: themeColor.danger }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    textAlign: "center",
    fontSize: 24,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  menuItem: {
    width: "45%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColor.primary,
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
  },
  menuItemText: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColor.danger700,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
  },
});
