import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Application = {
  id: string;
  companyId: string;
  eventId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  companyName?: string;
  applicantName?: string;
  position?: string;
};

export default function ApplicationDetails({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "ApplicationDetails">) {
  const { isDarkmode } = useTheme();
  const { applicationId } = route.params;
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore();

  useEffect(() => {
    fetchApplicationDetails();
  }, []);

  const fetchApplicationDetails = async () => {
    try {
      const applicationRef = doc(db, "eventRegistrations", applicationId);
      const applicationSnap = await getDoc(applicationRef);
      
      if (applicationSnap.exists()) {
        const appData = applicationSnap.data() as Application;
        appData.id = applicationSnap.id;

        // Fetch company details
        const companyRef = doc(db, "companies", appData.companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          appData.companyName = companySnap.data().name;
        }

        // Fetch user details
        const userRef = doc(db, "user", appData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          appData.applicantName = userSnap.data().displayName;
          appData.position = userSnap.data().designation;
        }

        setApplication(appData);
      } else {
        Alert.alert("Error", "Application not found");
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
      Alert.alert("Error", "Failed to fetch application details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "eventRegistrations", applicationId), {
        status: "approved",
      });
      Alert.alert("Success", "Application approved successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error approving application:", error);
      Alert.alert("Error", "Failed to approve application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "eventRegistrations", applicationId), {
        status: "rejected",
      });
      Alert.alert("Success", "Application rejected successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error rejecting application:", error);
      Alert.alert("Error", "Failed to reject application");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <TopNav
          middleContent="Application Details"
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? themeColor.white100 : themeColor.dark}
            />
          }
          leftAction={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColor.primary} />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopNav
        middleContent="Application Details"
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
        {application && (
          <View>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>{application.companyName || 'Unknown Company'}</Text>

            <Text style={styles.label}>Applicant:</Text>
            <Text style={styles.value}>{application.applicantName || 'Unknown Applicant'}</Text>

            <Text style={styles.label}>Position:</Text>
            <Text style={styles.value}>{application.position || 'Not specified'}</Text>

            <Text style={styles.label}>Application Date:</Text>
            <Text style={styles.value}>{new Date(application.createdAt).toLocaleString()}</Text>

            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{application.status}</Text>

            <View style={styles.buttonContainer}>
              <Button
                text="Approve"
                onPress={handleApprove}
                style={styles.approveButton}
                disabled={application.status !== 'pending'}
              />
              <Button
                text="Reject"
                status="danger"
                onPress={handleReject}
                style={styles.rejectButton}
                disabled={application.status !== 'pending'}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  approveButton: {
    flex: 1,
    marginRight: 10,
  },
  rejectButton: {
    flex: 1,
    marginLeft: 10,
  },
});