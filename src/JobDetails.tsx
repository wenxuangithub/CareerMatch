import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import axios from "axios";

type JobDetailsProps = NativeStackScreenProps<MainStackParamList, "JobDetails">;

type Analysis = {
  skills_match: string[];
  education_match: string;
  job_description_keywords: string[];
  interested_part: string;
  error?: string;
  raw_response?: string;
};

export default function JobDetails({ route, navigation }: JobDetailsProps) {
  const { isDarkmode } = useTheme();
  const { job, companyName, eventId, companyId } = route.params;
  const [isApplying, setIsApplying] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  //I will move this part to the hooks later..
  const API_BASE_URL = "http://10.10.5.32:5000";

  const handleApply = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to apply for jobs.");
      return;
    }

    if (!eventId || !companyId) {
      Alert.alert(
        "Error",
        "Missing event or company information. Please try again later."
      );
      return;
    }

    setIsApplying(true);

    try {
      // Check if user has a resume
      const userDoc = await getDoc(doc(db, "user", auth.currentUser.uid));
      const userData = userDoc.data();

      if (!userData || !userData.pdfURL) {
        Alert.alert(
          "Resume Required",
          "You need to upload a resume before applying for jobs. Please update your profile with a resume.",
          [{ text: "OK", onPress: () => navigation.navigate("StudentProfile") }]
        );
        return;
      }

      // Process submitted resume
      let analysis: Analysis;
      try {
        const analysisResponse = await axios.post(
          `${API_BASE_URL}/process_submitted_resume`,
          {
            resumeUrl: userData.pdfURL,
            job: job,
          }
        );
        analysis = analysisResponse.data.analysis;

        // Ensure all expected fields are present
        analysis = {
          skills_match: analysis.skills_match || [],
          education_match: analysis.education_match || "Unable to determine",
          job_description_keywords: analysis.job_description_keywords || [],
          interested_part: analysis.interested_part || "Unable to determine",
          ...(analysis.error && { error: analysis.error }),
          ...(analysis.raw_response && { raw_response: analysis.raw_response }),
        };
      } catch (error) {
        console.error("Error processing resume:", error);
        analysis = {
          error: "Failed to process resume",
          skills_match: [],
          education_match: "Unable to determine",
          job_description_keywords: [],
          interested_part: "Unable to determine",
        };
      }

      // Prepare the application data
      const applicationData = {
        userId: auth.currentUser.uid,
        eventId: eventId,
        companyId: companyId,
        role: job.role || "Unspecified Role",
        date: serverTimestamp(),
        analysis: analysis,
        resumeURL: userData.pdfURL,
        user: userData.email,
        status: "awaiting",
      };

      // Add application to JobApplication collection
      const docRef = await addDoc(
        collection(db, "JobApplication"),
        applicationData
      );

      console.log("Application submitted with ID: ", docRef.id);
      Alert.alert(
        "Success",
        "Your application has been submitted successfully!"
      );
    } catch (error) {
      console.error("Error applying for job:", error);
      Alert.alert(
        "Error",
        "Failed to submit your application. Please try again."
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Render job details only if job object is defined
  const renderJobDetails = () => {
    if (!job) {
      return <Text>Job details are not available.</Text>;
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.jobTitle}>{job.role || "Unspecified Role"}</Text>
          <Text style={styles.companyName}>
            {companyName || "Unspecified Company"}
          </Text>
          <Text style={styles.jobLocation}>
            {job.location || "Location not specified"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailItem}>
            <Ionicons
              name="business-outline"
              size={20}
              color={themeColor.primary}
            />
            <Text style={styles.detailText}>
              {job.classification || "Classification not specified"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={themeColor.primary}
            />
            <Text style={styles.detailText}>
              {job.time || "Time not specified"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>
            {job.descriptions || "No description available"}
          </Text>
        </View>
      </>
    );
  };

  return (
    <Layout>
      <TopNav
        middleContent="Job Details"
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
        {renderJobDetails()}
        <Button
          text={isApplying ? "Applying..." : "Apply Now"}
          onPress={handleApply}
          style={styles.applyButton}
          disabled={isApplying || !job}
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
  header: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  companyName: {
    fontSize: 18,
    color: themeColor.primary,
    marginBottom: 5,
  },
  jobLocation: {
    fontSize: 16,
    color: themeColor.gray,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  applyButton: {
    marginTop: 20,
    marginBottom: 30, // Add some bottom margin for better scrolling
  },
});
