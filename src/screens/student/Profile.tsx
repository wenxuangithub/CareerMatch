import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, User } from "firebase/auth";
import {
  Layout,
  TopNav,
  Text,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "StudentProfile">) {
  const { isDarkmode, setTheme } = useTheme();
  const auth = getAuth();
  const db = getFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        try {
          const docRef = doc(db, "user", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [auth.currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColor.primary} />
      </View>
    );
  }

  return (
    <Layout>
      <TopNav
        middleContent="Student Profile"
        rightContent={
          <Ionicons
            name={isDarkmode ? "sunny" : "moon"}
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => {
          setTheme(isDarkmode ? "light" : "dark");
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <Image
            source={userData?.photoURL ? { uri: userData.photoURL } : require("../../../assets/images/login.png")}
            style={styles.profileImage}
          />
          <Text fontWeight="bold" style={styles.name}>{userData?.displayName || "Not Specified"}</Text>
          <Text style={styles.details}>{userData?.location || "Location Not Specified"}</Text>
          <Text style={styles.details}>{userData?.email || "Email Not Specified"}</Text>
        </View>

        <View style={styles.detailsSection}>
          <DetailItem label="Phone Number" value={userData?.phone} />
          <DetailItem label="Personal Summary" value={userData?.personalSummary} />
          <DetailItem label="Education" value={userData?.education} />
          <DetailItem label="Resume" value={userData?.pdfURL ? "Resume Uploaded" : "No Resume"} />
          <DetailItem label="Location" value={userData?.location} />
        </View>

        <Button
          text="Edit Profile"
          onPress={() => navigation.navigate("EditStudentProfile")}
          style={styles.editButton}
        />
      </ScrollView>
    </Layout>
  );
}

const DetailItem = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailItem}>
    <Text fontWeight="bold">{label}:</Text>
    <Text>{value || "Not Specified"}</Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    marginBottom: 5,
  },
  details: {
    fontSize: 16,
    color: 'gray',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editButton: {
    marginTop: 20,
  },
});