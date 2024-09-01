import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
  Modal,
} from "react-native";
import {
  Layout,
  TopNav,
  Text,
  Button,
  TextInput,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { RadioButton } from "react-native-paper";

type Question = {
  id: string;
  type: "text" | "multipleChoice" | "yesNo";
  question: string;
  options?: string[];
};

const CustomDropdown = ({ options, value, onSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkmode } = useTheme();

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text>{value || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDarkmode && styles.modalContentDark]}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.optionItem}
                onPress={() => {
                  onSelect(option);
                  setModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    isDarkmode && styles.optionTextDark,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              text="Cancel"
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function EventForm({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventForm">) {
  const { isDarkmode } = useTheme();
  const { eventId, questionnaireId } = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const questionnaireRef = doc(db, "questionnaires", questionnaireId);
        const questionnaireSnap = await getDoc(questionnaireRef);
        if (questionnaireSnap.exists()) {
          const fetchedQuestions =
            questionnaireSnap.data().questionnaire.questions;
          setQuestions(fetchedQuestions);
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
        Alert.alert("Error", "Failed to load the questionnaire");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [questionnaireId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to submit the form");
      return;
    }

    setIsSubmitting(true);
    try {
      const qrDataRef = collection(db, "QRData");
      await addDoc(qrDataRef, {
        eventId,
        userId: auth.currentUser.uid,
        answers,
        timestamp: new Date().toISOString(),
        task: "attendance",
      });

      navigation.navigate("QRRecorded", {
        message:
          "Attendance and questionnaire responses recorded successfully!",
        success: true,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert("Error", "Failed to submit the form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = useCallback(
    ({ item }: ListRenderItemInfo<Question>) => {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{item.question}</Text>
          {item.type === "text" && (
            <TextInput
              placeholder="Enter your answer"
              value={answers[item.id] || ""}
              onChangeText={(text) => handleAnswerChange(item.id, text)}
              style={styles.textInput}
            />
          )}
          {item.type === "multipleChoice" && (
            <CustomDropdown
              options={item.options || []}
              value={answers[item.id]}
              onSelect={(option) => handleAnswerChange(item.id, option)}
            />
          )}
          {item.type === "yesNo" && (
            <RadioButton.Group
              onValueChange={(value) => handleAnswerChange(item.id, value)}
              value={answers[item.id] || ""}
            >
              <View style={styles.radioButtonContainer}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => handleAnswerChange(item.id, "Yes")}
                >
                  <RadioButton value="Yes" />
                  <Text>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => handleAnswerChange(item.id, "No")}
                >
                  <RadioButton value="No" />
                  <Text>No</Text>
                </TouchableOpacity>
              </View>
            </RadioButton.Group>
          )}
        </View>
      );
    },
    [answers]
  );

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Text>Loading questionnaire...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopNav
        middleContent="Event Form"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          <Button
            text={isSubmitting ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isSubmitting}
          />
        }
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  submitButton: {
    marginTop: 20,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalContentDark: {
    backgroundColor: "#333",
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  optionText: {
    fontSize: 16,
  },
  optionTextDark: {
    color: "white",
  },
  cancelButton: {
    marginTop: 10,
  },
});
