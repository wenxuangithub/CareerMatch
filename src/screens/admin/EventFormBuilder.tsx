import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Layout, TopNav, Text, Button, TextInput, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { getAuth } from 'firebase/auth';

type Question = {
  id: string;
  type: "text" | "multipleChoice" | "yesNo";
  question: string;
  options?: string[];
};

type Questionnaire = {
  name: string;
  questions: Question[];
};

export default function EventFormBuilder({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventFormBuilder">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
    name: "",
    questions: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionType, setQuestionType] = useState<
    "text" | "multipleChoice" | "yesNo"
  >("text");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const db = getFirestore();
  const auth = getAuth();

  const handlePreview = () => {
    if (questionnaire.questions.length > 0) {
      navigation.navigate("FormContentView", { questionnaire });
    } else {
      Alert.alert("Error", "No questions to preview");
    }
  };

  const saveQuestionnaire = async () => {
    if (questionnaire.questions.length === 0) {
      Alert.alert("Error", "Please add at least one question");
      return;
    }

    setIsLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const questionnaireData = {
        eventId,
        userId,
        questionnaire: {
          name: questionnaire.name,
          questions: questionnaire.questions,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "questionnaires"),
        questionnaireData
      );

      Alert.alert("Success", "Questionnaire saved successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      Alert.alert("Error", "Failed to save questionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    setCurrentQuestion(null);
    setQuestionType("text");
    setQuestionText("");
    setOptions([]);
    setModalVisible(true);
  };

  const editQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setQuestionType(question.type);
    setQuestionText(question.question);
    setOptions(question.options || []);
    setModalVisible(true);
  };

  const saveQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert("Error", "Question text cannot be empty");
      return;
    }

    const newQuestion: Question = {
      id: currentQuestion?.id || Date.now().toString(),
      type: questionType,
      question: questionText.trim(),
      ...(questionType === "multipleChoice" ? { options } : {}),
    };

    setQuestionnaire((prev) => ({
      ...prev,
      questions: currentQuestion
        ? prev.questions.map((q) =>
            q.id === currentQuestion.id ? newQuestion : q
          )
        : [...prev.questions, newQuestion],
    }));

    setModalVisible(false);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestionnaire((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Layout>
      <TopNav
        middleContent="Event Form Builder"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
        rightContent={
          <Ionicons
            name="eye-outline"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={handlePreview}
      />
      <ScrollView style={styles.container}>
        <TextInput
          placeholder="Form Name"
          value={questionnaire.name}
          onChangeText={(text) =>
            setQuestionnaire((prev) => ({ ...prev, name: text }))
          }
          style={styles.formNameInput}
        />
        {questionnaire.questions.map((question, index) => (
          <View key={question.id} style={styles.questionItem}>
            <Text style={styles.questionText}>{`${index + 1}. ${
              question.question
            }`}</Text>
            <Text style={styles.questionType}>{question.type}</Text>
            <View style={styles.questionActions}>
              <Button
                text="Edit"
                onPress={() => editQuestion(question)}
                style={styles.actionButton}
              />
              <Button
                text="Delete"
                status="danger"
                onPress={() => deleteQuestion(question.id)}
                style={styles.actionButton}
              />
            </View>
          </View>
        ))}
        <Button
          text="Add Question"
          onPress={addQuestion}
          style={styles.addButton}
        />
        <Button
          text="Save Questionnaire"
          onPress={saveQuestionnaire}
          style={styles.saveButton}
          disabled={isLoading}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDarkmode ? '#2c2c2c' : '#e0e0e0' }]}>
            <Text style={styles.modalTitle}>
              {currentQuestion ? "Edit Question" : "Add New Question"}
            </Text>
            <DropDownPicker
              open={dropdownOpen}
              value={questionType}
              items={[
                { label: "Text", value: "text" },
                { label: "Multiple Choice", value: "multipleChoice" },
                { label: "Yes/No", value: "yesNo" },
              ]}
              setOpen={setDropdownOpen}
              setValue={setQuestionType}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
            <TextInput
              placeholder="Question"
              value={questionText}
              onChangeText={setQuestionText}
              style={styles.questionInput}
            />
            {questionType === "multipleChoice" && (
              <View style={styles.optionsContainer}>
                <ScrollView style={styles.optionsList}>
                  {options.map((option, index) => (
                    <View key={index} style={styles.optionItem}>
                      <Text>{option}</Text>
                      <TouchableOpacity onPress={() => removeOption(index)}>
                        <Ionicons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.addOptionContainer}>
                  <TextInput
                    placeholder="New Option"
                    value={newOption}
                    onChangeText={setNewOption}
                    style={styles.optionInput}
                  />
                  <Button
                    text="Add Option"
                    onPress={addOption}
                    style={styles.addOptionButton}
                  />
                </View>
              </View>
            )}
            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                status="danger"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                text="Save"
                onPress={saveQuestion}
                style={styles.modalButton}
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        width: Dimensions.get('window').width * 0.9,
        maxHeight: Dimensions.get('window').height * 0.8,
        borderRadius: 20,
        padding: 20,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
      },
  optionsContainer: {
    marginBottom: 15,
    maxHeight: 200,
  },
  optionsList: {
    maxHeight: 150,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  addOptionContainer: {
    marginTop: 10,
  },
  optionInput: {
    marginBottom: 10,
  },
  addOptionButton: {
    width: "100%",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  formNameInput: {
    marginBottom: 20,
  },
  questionItem: {
    backgroundColor: "grey",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  questionType: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  questionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    marginLeft: 10,
  },
  addButton: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 20,
  },
  dropdown: {
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
  },
  dropdownContainer: {
    backgroundColor: "#f0f0f0",
  },
  questionInput: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});
