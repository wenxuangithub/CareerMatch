import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";

export default function QRRecorded({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "QRRecorded">) {
  const { isDarkmode } = useTheme();
  const { message, success } = route.params;

  return (
    <Layout>
      <TopNav
        middleContent="Attendance Status"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.navigate("Home")}
      />
      <View style={styles.container}>
        <Text style={styles.emoji}>{success ? "✅" : "ℹ️"}</Text>
        <Text style={[styles.message, success ? styles.successMessage : styles.infoMessage]}>
          {message}
        </Text>
        <Text style={styles.datetime}>{new Date().toLocaleString()}</Text>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successMessage: {
    color: 'green',
  },
  infoMessage: {
    color: 'blue',
  },
  datetime: {
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    width: '100%',
  },
});