import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Layout,
  TopNav,
  Text,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { useFocusEffect } from "@react-navigation/native";

export default function ({
  navigation,
  route,
}: NativeStackScreenProps<MainStackParamList, "StudentProfile">) {
  const { isDarkmode, setTheme } = useTheme();
  const auth = getAuth();
  const db = getFirestore();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    if (auth.currentUser) {
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
  }, [auth.currentUser, db]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

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
            source={
              userData?.photoURL
                ? { uri: userData.photoURL }
                : require("../../../assets/images/defaultpfp.png")
            }
            style={styles.profileImage}
            defaultSource={require("../../../assets/images/defaultpfp.png")}
          />
          <Text fontWeight="bold" style={styles.name}>
            {userData?.displayName || "Not Specified"}
          </Text>
          <Text style={styles.details}>
            {userData?.location || "Location Not Specified"}
          </Text>
          <Text style={styles.details}>
            {userData?.email || "Email Not Specified"}
          </Text>
        </View>

        <View style={styles.detailsSection}>
          <DetailItem label="Phone Number" value={userData?.phone} />
          <DetailItem label="Education" value={userData?.education} />
          <DetailItem
            label="Resume"
            value={userData?.resumeName || "No Resume"}
          />
        </View>

        <Button
          text="Edit Profile"
          onPress={() => navigation.navigate("EditStudentProfile")}
          style={styles.editButton}
        />

        <View style={styles.personalSummarySection}>
          <Text fontWeight="bold" style={styles.personalSummaryTitle}>
            Personal Summary
          </Text>
          <Text style={styles.personalSummaryText}>
            {userData?.personalSummary || "No personal summary provided."}
          </Text>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: "center",
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
    color: "gray",
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  editButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  personalSummarySection: {
    marginTop: 20,
  },
  personalSummaryTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  personalSummaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
