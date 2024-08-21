import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import { MainStackParamList } from "./types/navigation";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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
  const auth = getAuth();
  const [cardData, setCardData] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { userId } = route.params;

  useEffect(() => {
    fetchCardData();
    checkIfSaved();
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
    setIsOwner(auth.currentUser?.uid === userId);
  };

  const checkIfSaved = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "user", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setIsSaved(userData.savedCards && userData.savedCards.some((card: any) => card.userId === userId));
      }
    }
  };

  const handleSaveCard = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "user", auth.currentUser.uid);
      await updateDoc(userRef, {
        savedCards: arrayUnion({ userId, name: cardData.name })
      });
      
      // Create notification
      const notificationRef = doc(db, "Notifications", userId);
      await setDoc(notificationRef, {
        userId: userId,
        content: `${auth.currentUser.displayName} saved your digital card.`,
        byWho: auth.currentUser.displayName
      }, { merge: true });

      setIsSaved(true);
      Alert.alert("Saved", "Digital card saved successfully");
    }
  };

  const handleLinkPress = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  const renderRightAction = () => {
    if (isOwner) {
      return (
        <Ionicons
          name="pencil"
          size={20}
          color={isDarkmode ? themeColor.white100 : themeColor.dark}
          onPress={() => navigation.navigate("EditDigitalCard", { userId })}
        />
      );
    } else if (isSaved) {
      return (
        <Ionicons
          name="checkmark"
          size={20}
          color={isDarkmode ? themeColor.white100 : themeColor.dark}
          onPress={() => Alert.alert("Already Saved", "This card is already in your saved list.")}
        />
      );
    } else {
      return (
        <Ionicons
          name="add"
          size={20}
          color={isDarkmode ? themeColor.white100 : themeColor.dark}
          onPress={handleSaveCard}
        />
      );
    }
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
    colorOptions[cardData.background as keyof typeof colorOptions] || colorOptions["Default"];

  return (
    <Layout>
      <TopNav
        middleContent="Digital Card"
        rightContent={renderRightAction()}
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

        {cardData.links.map((link: any, index: number) => (
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