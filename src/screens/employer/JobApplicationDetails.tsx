import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
  TextInput,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";

type JobApplicationDetailsProps = NativeStackScreenProps<
  MainStackParamList,
  "JobApplicationDetails"
>;

export default function JobApplicationDetails({
  route,
  navigation,
}: JobApplicationDetailsProps) {
  const { isDarkmode, setTheme } = useTheme();
  const { application } = route.params;
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [interviewMessage, setInterviewMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const db = getFirestore();

  const handleStatusUpdate = async (status: "drop" | "interview") => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "JobApplication", application.id), { status });
      if (status === "interview") {
        setShowInterviewModal(true);
      } else {
        Alert.alert(
          "Status Updated",
          "Application has been marked as dropped."
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      Alert.alert(
        "Error",
        "Failed to update application status. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleInterview = async () => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "JobApplication", application.id), {
        status: "interview",
        interviewDate: interviewDate.toISOString(),
        interviewMessage,
      });
      Alert.alert(
        "Interview Scheduled",
        "The interview has been scheduled and the applicant will be notified."
      );
      setShowInterviewModal(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error scheduling interview:", error);
      Alert.alert(
        "Error",
        "Failed to schedule the interview. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewResume = () => {
    if (application.userData.pdfURL) {
      Linking.openURL(application.userData.pdfURL).catch((err) =>
        Alert.alert("Error", "Couldn't open the resume. Please try again.")
      );
    } else {
      Alert.alert("Error", "No resume URL found for this applicant.");
    }
  };

  const renderAnalysisSection = (title: string, content: string | string[]) => (
    <View style={styles.analysisSection}>
      <Text style={styles.analysisSectionTitle}>{title}</Text>
      {Array.isArray(content) ? (
        content.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={themeColor.success}
            />
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.analysisContent}>{content}</Text>
      )}
    </View>
  );

  const onChangeDatePicker = (event, selectedDate) => {
    const currentDate = selectedDate || interviewDate;
    setShowDatePicker(Platform.OS === "ios");
    setInterviewDate(currentDate);
  };

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
        <View style={styles.header}>
          <Text style={styles.title}>{application.userData.displayName}</Text>
          <Text style={styles.subtitle}>{application.role}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Analysis</Text>
          {renderAnalysisSection(
            "Skills Match",
            application.analysis.skills_match
          )}
          {renderAnalysisSection(
            "Education Match",
            application.analysis.education_match
          )}
          {renderAnalysisSection(
            "Job Description Keywords",
            application.analysis.job_description_keywords
          )}
          {renderAnalysisSection(
            "Interested Parts",
            application.analysis.interested_part
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            text="Drop"
            status="danger"
            onPress={() => handleStatusUpdate("drop")}
            style={styles.button}
            disabled={isProcessing}
          />
          <Button
            text="Proceed"
            onPress={() => handleStatusUpdate("interview")}
            style={styles.button}
            disabled={isProcessing}
          />
          <Button
            text="View Resume"
            onPress={handleViewResume}
            style={styles.button}
            disabled={isProcessing}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showInterviewModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>Schedule Interview</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {interviewDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={interviewDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onChangeDatePicker}
                />
              )}
              <TextInput
                placeholder="Message to Applicant"
                value={interviewMessage}
                onChangeText={setInterviewMessage}
                multiline
                style={[styles.input, styles.textArea]}
              />
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <Button
                text="Schedule Interview"
                onPress={handleScheduleInterview}
                style={styles.modalButton}
                disabled={isProcessing}
              />
              <Button
                text="Cancel"
                status="danger"
                onPress={() => setShowInterviewModal(false)}
                style={styles.modalButton}
                disabled={isProcessing}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: themeColor.white,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: themeColor.primary,
  },
  input: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: themeColor.gray200,
    borderRadius: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: themeColor.gray100,
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateButtonText: {
    textAlign: "center",
    color: themeColor.dark,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: themeColor.gray200,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    color: themeColor.gray,
  },
  card: {
    backgroundColor: themeColor.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: themeColor.primary,
  },
  analysisSection: {
    marginBottom: 15,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: themeColor.dark,
  },
  analysisContent: {
    fontSize: 14,
    color: themeColor.gray,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  listItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: themeColor.gray,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
