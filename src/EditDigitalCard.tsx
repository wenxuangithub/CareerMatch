import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MainStackParamList } from "./types/navigation";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  Button,
  Text,
  TopNav,
  useTheme,
  themeColor,
  TextInput,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";

const colorOptions = [
  { name: "Default", bg: "#FFFFFF", button: "#000000" },
  { name: "Dark Blue", bg: "#1A237E", button: "#3949AB" },
  { name: "Dark Green", bg: "#1B5E20", button: "#2E7D32" },
  { name: "Dark Purple", bg: "#4A148C", button: "#6A1B9A" },
];

const iconOptions = [
  { name: "GitHub", icon: "logo-github" },
  { name: "LinkedIn", icon: "logo-linkedin" },
  { name: "Instagram", icon: "logo-instagram" },
  { name: "Link", icon: "link" },
];

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EditDigitalCard">) {
  const { isDarkmode, setTheme } = useTheme();
  const db = getFirestore();
  const auth = getAuth();
  const { userId } = route.params;

  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [links, setLinks] = useState([]);
  const [currentIcon, setCurrentIcon] = useState("link");
  const [currentLinkName, setCurrentLinkName] = useState("");
  const [currentLinkUrl, setCurrentLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCardData();
  }, []);

  const fetchCardData = async () => {
    const cardRef = doc(db, "DigitalCard", userId);
    const cardSnap = await getDoc(cardRef);
    if (cardSnap.exists()) {
      const data = cardSnap.data();
      setLinks(data.links || []);
      setSelectedColor(
        colorOptions.find((c) => c.name === data.background) || colorOptions[0]
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "user", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const cardRef = doc(db, "DigitalCard", userId);
      await setDoc(cardRef, {
        name: userData.displayName,
        email: userData.email,
        links: links,
        background: selectedColor.name,
      });

      Alert.alert("Success", "Digital card saved successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving digital card: ", error);
      Alert.alert("Error", "Failed to save digital card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    if (currentLinkUrl && currentLinkName) {
      setLinks([
        ...links,
        {
          name: currentLinkName,
          link: currentLinkUrl,
          icon: currentIcon,
        },
      ]);
      setCurrentIcon("link");
      setCurrentLinkName("");
      setCurrentLinkUrl("");
    } else {
      Alert.alert("Error", "Please enter both a name and a URL for the link");
    }
  };

  const removeLink = (index) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const moveLink = (index, direction) => {
    if (
      (direction === -1 && index > 0) ||
      (direction === 1 && index < links.length - 1)
    ) {
      const newLinks = [...links];
      const temp = newLinks[index];
      newLinks[index] = newLinks[index + direction];
      newLinks[index + direction] = temp;
      setLinks(newLinks);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Edit Digital Card"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>Choose Background Color</Text>
        <View style={styles.colorContainer}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color.name}
              style={[
                styles.colorOption,
                { backgroundColor: color.bg },
                selectedColor.name === color.name && styles.selectedColor,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Add Links</Text>
        <View style={styles.addLinkContainer}>
          <View style={styles.iconContainer}>
            {iconOptions.map((option) => (
              <TouchableOpacity
                key={option.name}
                onPress={() => setCurrentIcon(option.icon)}
                style={[
                  styles.iconOption,
                  currentIcon === option.icon && styles.selectedIcon,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={themeColor.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Link Name"
              value={currentLinkName}
              onChangeText={setCurrentLinkName}
              style={styles.linkInput}
            />
            <TextInput
              placeholder="Link URL"
              value={currentLinkUrl}
              onChangeText={setCurrentLinkUrl}
              style={styles.linkInput}
            />
            <Button text="Add" onPress={addLink} style={styles.addButton} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Links</Text>
        {links.map((link, index) => (
          <View key={index} style={styles.linkItem}>
            <Ionicons
              name={link.icon}
              size={24}
              color={themeColor.primary}
              style={styles.linkIcon}
            />
            <View style={styles.linkTextContainer}>
              <Text style={styles.linkName}>{link.name}</Text>
              <Text style={styles.linkUrl}>{link.link}</Text>
            </View>
            <View style={styles.linkActions}>
              <TouchableOpacity
                onPress={() => moveLink(index, -1)}
                style={styles.actionButton}
              >
                <Ionicons name="arrow-up" size={24} color={themeColor.gray} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveLink(index, 1)}
                style={styles.actionButton}
              >
                <Ionicons name="arrow-down" size={24} color={themeColor.gray} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeLink(index)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={themeColor.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Button
          text={loading ? "Saving..." : "Save Digital Card"}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={loading}
        />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: themeColor.primary,
  },
  addLinkContainer: {
    marginBottom: 20,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  iconOption: {
    padding: 10,
    borderRadius: 5,
  },
  selectedIcon: {
    backgroundColor: themeColor.gray200,
  },
  inputContainer: {
    marginBottom: 10,
  },
  linkInput: {
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColor.gray200,
  },
  linkIcon: {
    marginRight: 10,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkName: {
    fontWeight: "bold",
  },
  linkUrl: {
    fontSize: 12,
    color: themeColor.gray,
  },
  linkActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 5,
  },
  saveButton: {
    marginTop: 20,
  },
});
