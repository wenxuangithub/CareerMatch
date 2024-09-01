import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function AttendanceToCSV({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "AttendanceToCSV">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    fetchAttendanceCount();
  }, []);

  const fetchAttendanceCount = async () => {
    setIsLoading(true);
    try {
      const qrDataRef = collection(db, "QRData");
      const q = query(qrDataRef, 
        where("eventId", "==", eventId),
        where("task", "==", "attendance"),
      );
      const querySnapshot = await getDocs(q);
      setAttendanceCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching attendance count:", error);
      Alert.alert("Error", "Failed to fetch attendance count");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch event data to get questionnaireId
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      const eventData = eventSnap.data();
      const questionnaireId = eventData?.questionnaireId;

      let questions = [];
      if (questionnaireId) {
        // Fetch questionnaire data
        const questionnaireRef = doc(db, "questionnaires", questionnaireId);
        const questionnaireSnap = await getDoc(questionnaireRef);
        const questionnaireData = questionnaireSnap.data();
        questions = questionnaireData?.questionnaire.questions || [];
      }

      // Prepare CSV header
      let csvHeader = "Time,UserId,Name,Degree,Email,PhoneNumber";
      const questionIds = questions.map(q => q.id);
      if (questions.length > 0) {
        questions.forEach(q => {
          csvHeader += `,"${q.question}"`;
        });
      }
      csvHeader += "\n";

      // Fetch attendance data
      const qrDataRef = collection(db, "QRData");
      const q = query(qrDataRef, 
        where("eventId", "==", eventId),
        where("task", "==", "attendance"),
      );
      const querySnapshot = await getDocs(q);

      let csvContent = csvHeader;

      for (const document of querySnapshot.docs) {
        const data = document.data();
        const userDocRef = doc(db, "user", data.userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};

        let row = `${data.timestamp},${data.userId},${userData.displayName || ''},${userData.education || ''},${userData.email || ''},${userData.phone || ''}`;

        // Add answers in the correct order if questionnaire exists
        if (questions.length > 0) {
          questionIds.forEach(qId => {
            row += `,"${data.answers?.[qId] || ''}"`;
          });
        }

        csvContent += row + "\n";
      }

      const fileUri = FileSystem.documentDirectory + "attendance.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Attendance Data' });

    } catch (error) {
      console.error("Error exporting to CSV:", error);
      Alert.alert("Error", "Failed to export data to CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Attendance Export"
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
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Attendance Summary</Text>
          {isLoading ? (
            <Text>Loading...</Text>
          ) : (
            <Text style={styles.summaryText}>Total Attendance: {attendanceCount}</Text>
          )}
        </View>
        <Button
          text={isExporting ? "Exporting..." : "Export Data to CSV"}
          onPress={exportToCSV}
          style={styles.exportButton}
          disabled={isExporting}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
  },
  exportButton: {
    marginTop: 20,
  },
});