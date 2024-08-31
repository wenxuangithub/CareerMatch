import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

type Questionnaire = {
  id: string;
  name: string;
  // Add other relevant fields
};

export default function AttendanceFeature({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "AttendanceFeature">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore();

  useEffect(() => {
    fetchSelectedQuestionnaire();
  }, []);

  const fetchSelectedQuestionnaire = async () => {
    setIsLoading(true);
    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        if (eventData.selectedQuestionnaireId) {
          const questionnaireRef = doc(db, "questionnaires", eventData.selectedQuestionnaireId);
          const questionnaireSnap = await getDoc(questionnaireRef);
          if (questionnaireSnap.exists()) {
            setSelectedQuestionnaire({
              id: questionnaireSnap.id,
              ...questionnaireSnap.data()
            } as Questionnaire);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching selected questionnaire:", error);
      Alert.alert("Error", "Failed to fetch selected questionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Attendance Feature"
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
        {/* First Section: Selected Questionnaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Questionnaire</Text>
          {selectedQuestionnaire ? (
            <TouchableOpacity
              style={styles.questionnaireItem}
              onPress={() => navigation.navigate("FormContentView", { questionnaireId: selectedQuestionnaire.id })}
            >
              <Text>{selectedQuestionnaire.name}</Text>
            </TouchableOpacity>
          ) : (
            <Text>No questionnaire selected</Text>
          )}
        </View>

        {/* Second Section: Questionnaire Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questionnaire Management</Text>
          <View style={styles.buttonContainer}>
            <Button
              text="Build Questionnaire"
              onPress={() => navigation.navigate("EventFormBuilder", { eventId })}
              style={styles.button}
            />
            <Button
              text="Select Template"
              onPress={() => navigation.navigate("EventFormTemplate", { eventId })}
              style={styles.button}
            />
          </View>
        </View>

        {/* Third Section: QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <Button
            text="Generate QR Code"
            onPress={() => Alert.alert("Coming Soon", "QR Code generation will be available in a future update.")}
            style={styles.button}
          />
        </View>

        {/* Export Data Button */}
        <Button
          text="Export Data to CSV"
          onPress={() => Alert.alert("Coming Soon", "Data export feature will be available in a future update.")}
          style={styles.exportButton}
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionnaireItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  exportButton: {
    marginTop: 20,
  },
});