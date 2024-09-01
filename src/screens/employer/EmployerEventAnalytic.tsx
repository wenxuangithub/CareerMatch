import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type EmployerEventAnalyticProps = NativeStackScreenProps<MainStackParamList, "EmployerEventAnalytic">;

export default function EmployerEventAnalytic({ route, navigation }: EmployerEventAnalyticProps) {
  const { isDarkmode } = useTheme();
  const { eventId, companyId } = route.params;
  const [isExporting, setIsExporting] = useState(false);

  const db = getFirestore();

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Query all job applications for this event and company
      const jobApplicationsRef = collection(db, "JobApplication");
      const q = query(jobApplicationsRef, 
        where("eventId", "==", eventId),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);

      let csvContent = "Time,Name,Phone,Email,Resume,Role\n";

      for (const doc of querySnapshot.docs) {
        const applicationData = doc.data();
        const userData = await getUserData(applicationData.userId);
        
        const row = [
          new Date(applicationData.date.toDate()).toLocaleString(),
          userData.displayName || "N/A",
          userData.phone || "N/A",
          userData.email || "N/A",
          userData.pdfURL || "N/A",
          applicationData.role
        ].map(field => `"${field}"`).join(",");

        csvContent += row + "\n";
      }

      const fileName = `JobApplications.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(filePath, { UTI: '.csv', mimeType: 'text/csv' });

      Alert.alert("Success", "CSV file has been generated and shared.");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      Alert.alert("Error", "Failed to export data to CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getUserData = async (userId: string) => {
    const userDocRef = doc(db, "user", userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : {};
  };

  return (
    <Layout>
      <TopNav
        middleContent="Event Analytics"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Job Applications Analytics</Text>
        <Button
          text={isExporting ? "Exporting..." : "Export to CSV"}
          onPress={exportToCSV}
          style={styles.exportButton}
          disabled={isExporting}
        />
        {isExporting && <ActivityIndicator size="large" color={themeColor.primary} style={styles.loader} />}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  exportButton: {
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
});