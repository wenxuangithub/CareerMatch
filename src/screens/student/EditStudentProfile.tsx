import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Layout,
  TopNav,
  Text,
  TextInput,
  Button,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EditStudentProfile">) {
  const { isDarkmode, setTheme } = useTheme();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [personalSummary, setPersonalSummary] = useState("");
  const [education, setEducation] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] =
    useState<DocumentPicker.DocumentResult | null>(null);
  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "user", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setProfileImage(userData.photoURL || null);
          setName(userData.displayName || "");
          setPhone(userData.phone || "");
          setPersonalSummary(userData.personalSummary || "");
          setEducation(userData.education || "");
          setResumeName(userData.resumeName || "");
          setLocation(userData.location || "");
        }
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeName(file.name);
        setResumeFile(result);
      }
    } catch (err) {
      console.error("Error picking document: ", err);
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `profiles/${auth.currentUser?.uid}/profile.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const uploadResume = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `resumes/${auth.currentUser?.uid}/${resumeName}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      let photoURL = profileImage;
      if (profileImage && !profileImage.startsWith("http")) {
        photoURL = await uploadImage(profileImage);
      }

      let pdfURL = "";
      if (resumeFile && resumeFile.assets && resumeFile.assets.length > 0) {
        pdfURL = await uploadResume(resumeFile.assets[0].uri);
      }

      const userRef = doc(db, "user", auth.currentUser.uid);
      await updateDoc(userRef, {
        photoURL,
        displayName: name,
        phone,
        personalSummary,
        education,
        pdfURL,
        resumeName,
        location,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Edit Profile"
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
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../../assets/images/defaultpfp.png")
            }
            style={styles.profileImage}
            defaultSource={require("../../../assets/images/defaultpfp.png")}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        <TextInput
          containerStyle={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          containerStyle={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          containerStyle={styles.input}
          placeholder="Personal Summary"
          value={personalSummary}
          onChangeText={setPersonalSummary}
          multiline
          numberOfLines={4}
        />
        <TextInput
          containerStyle={styles.input}
          placeholder="Education"
          value={education}
          onChangeText={setEducation}
        />
        <TouchableOpacity style={styles.resumeButton} onPress={pickResume}>
          <Text>{"Upload Resume"}</Text>
        </TouchableOpacity>
        {resumeName && (
          <Text style={styles.resumeNameText}>
            Selected: {resumeName || "Upload a Resume"}
          </Text>
        )}
        <TextInput
          containerStyle={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />

        <Button
          text={loading ? "Saving..." : "Save Profile"}
          onPress={saveProfile}
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
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePhotoText: {
    marginTop: 10,
    color: themeColor.primary,
  },
  input: {
    marginBottom: 15,
  },
  resumeButton: {
    padding: 15,
    backgroundColor: themeColor.gray200,
    borderRadius: 5,
    marginBottom: 5,
    alignItems: "center",
  },
  resumeNameText: {
    marginBottom: 15,
    color: themeColor.gray,
    fontStyle: "italic",
  },
  saveButton: {
    marginTop: 20,
  },
});
