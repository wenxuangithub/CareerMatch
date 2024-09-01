import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

type Questionnaire = {
  id: string;
  questionnaire: {
    name: string;
    questions: any[]; // You might want to define a more specific type for questions
  };
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

  useFocusEffect(
    React.useCallback(() => {
      fetchSelectedQuestionnaire();
    }, [])
  );

  const fetchSelectedQuestionnaire = async () => {
    setIsLoading(true);
    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        if (eventData.questionnaireId) {
          const questionnaireRef = doc(db, "questionnaires", eventData.questionnaireId);
          const questionnaireSnap = await getDoc(questionnaireRef);
          if (questionnaireSnap.exists()) {
            setSelectedQuestionnaire({
              id: questionnaireSnap.id,
              questionnaire: questionnaireSnap.data().questionnaire
            } as Questionnaire);
          }
        } else {
          setSelectedQuestionnaire(null);
        }
      }
    } catch (error) {
      console.error("Error fetching selected questionnaire:", error);
      Alert.alert("Error", "Failed to fetch selected questionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnselectQuestionnaire = async () => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        questionnaireId: null
      });
      setSelectedQuestionnaire(null);
      Alert.alert("Success", "Questionnaire unselected successfully");
    } catch (error) {
      console.error("Error unselecting questionnaire:", error);
      Alert.alert("Error", "Failed to unselect questionnaire");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColor.primary} />
        </View>
      </Layout>
    );
  }

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
          {selectedQuestionnaire && selectedQuestionnaire.questionnaire ? (
            <View>
              <TouchableOpacity
                style={styles.questionnaireItem}
                onPress={() => navigation.navigate("FormContentView", { questionnaire: selectedQuestionnaire.questionnaire })}
              >
                <Text>{selectedQuestionnaire.questionnaire.name}</Text>
              </TouchableOpacity>
              <Button
                text="Unselect Questionnaire"
                status="danger"
                onPress={handleUnselectQuestionnaire}
                style={styles.unselectButton}
              />
            </View>
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
            onPress={() =>  navigation.navigate("EventQRCode", { eventId })}
            style={styles.button}
          />
        </View>

        <Button
          text="Export Data to CSV"
          onPress={() => navigation.navigate("AttendanceToCSV", { eventId })}
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
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  unselectButton: {
    marginTop: 10,
  },
  exportButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});