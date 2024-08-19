import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { MainStackParamList } from "./types/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  Button,
  Text,
  TopNav,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";

const colorOptions = {
  Default: { bg: "#FFFFFF", button: "#000000", text: "#000000" },
  "Dark Blue": { bg: "#1A237E", button: "#3949AB", text: "#FFFFFF" },
  "Dark Green": { bg: "#1B5E20", button: "#2E7D32", text: "#FFFFFF" },
  "Dark Purple": { bg: "#4A148C", button: "#6A1B9A", text: "#FFFFFF" },
};

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "DigitalCard">) {
  const { isDarkmode, setTheme } = useTheme();
  const db = getFirestore();
  const [cardData, setCardData] = useState<any>(null);
  const { userId } = route.params;

  useEffect(() => {
    fetchCardData();
  }, [userId]);

  const fetchCardData = async () => {
    const cardRef = doc(db, "DigitalCard", userId);
    const userRef = doc(db, "user", userId);
    const [cardSnap, userSnap] = await Promise.all([
      getDoc(cardRef),
      getDoc(userRef),
    ]);

    if (cardSnap.exists() && userSnap.exists()) {
      setCardData({
        ...cardSnap.data(),
        photoURL: userSnap.data().photoURL,
      });
    } else {
      setCardData(null);
    }
  };

  const handleLinkPress = (url: string) => {
    // Check if the URL starts with http:// or https://
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  if (!cardData) {
    return (
      <Layout>
        <TopNav
          middleContent="Digital Card"
          rightContent={""}
          rightAction={() => {}}
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? themeColor.white100 : themeColor.dark}
            />
          }
          leftAction={() => navigation.goBack()}
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>Don't have a digital card ? Create Now !</Text>
          <Text></Text>
          <Button
            text="Create now !"
            onPress={() => navigation.navigate("EditDigitalCard", { userId })}
          ></Button>
        </View>
      </Layout>
    );
  }

  const colorScheme =
    colorOptions[cardData.background] || colorOptions["Default"];

  return (
    <Layout>
      <TopNav
        middleContent="Digital Card"
        rightContent={
          <Ionicons
            name="pencil"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => navigation.navigate("EditDigitalCard", { userId })}
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <View style={[styles.container, { backgroundColor: colorScheme.bg }]}>
        <Image
          source={
            cardData.photoURL
              ? { uri: cardData.photoURL }
              : require("../assets/images/defaultpfp.png")
          }
          style={styles.profileImage}
        />
        <Text style={[styles.name, { color: colorScheme.text }]}>
          {cardData.name}
        </Text>
        <Text style={[styles.email, { color: colorScheme.text }]}>
          {cardData.email}
        </Text>

        {cardData.links.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.linkButton, { backgroundColor: colorScheme.button }]}
            onPress={() => handleLinkPress(link.link)}
          >
            <Ionicons
              name={link.icon}
              size={24}
              color={colorScheme.text}
              style={styles.linkIcon}
            />
            <Text style={[styles.linkText, { color: colorScheme.text }]}>
              {link.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  email: {
    fontSize: 18,
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: "100%",
  },
  linkIcon: {
    marginRight: 10,
  },
  linkText: {
    fontSize: 16,
  },
});
