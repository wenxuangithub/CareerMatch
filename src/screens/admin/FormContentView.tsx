import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Layout, TopNav, Text, useTheme, themeColor, TextInput, Section } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { RadioButton } from 'react-native-paper';

type Question = {
  id: string;
  type: 'text' | 'multipleChoice' | 'yesNo';
  question: string;
  options?: string[];
};

type Questionnaire = {
  name: string;
  questions: Question[];
};

export default function FormContentView({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "FormContentView">) {
  const { isDarkmode } = useTheme();
  const { questionnaire } = route.params;

  const renderQuestion = (question: Question, index: number) => {
    switch (question.type) {
      case 'text':
        return (
          <Section key={question.id}>
            <Text style={styles.questionText}>{`${index + 1}. ${question.question}`}</Text>
            <TextInput
              placeholder="Enter your answer"
              editable={false} // This is a preview, so we make it non-editable
              style={styles.textInput}
            />
          </Section>
        );
      case 'multipleChoice':
        return (
          <Section key={question.id}>
            <Text style={styles.questionText}>{`${index + 1}. ${question.question}`}</Text>
            {question.options?.map((option, optionIndex) => (
              <View key={optionIndex} style={styles.radioOption}>
                <RadioButton
                  value={option}
                  status="unchecked"
                  onPress={() => {}} // No action in preview mode
                />
                <Text style={styles.optionText}>{option}</Text>
              </View>
            ))}
          </Section>
        );
      case 'yesNo':
        return (
          <Section key={question.id}>
            <Text style={styles.questionText}>{`${index + 1}. ${question.question}`}</Text>
            <View style={styles.yesNoContainer}>
              <View style={styles.radioOption}>
                <RadioButton
                  value="yes"
                  status="unchecked"
                  onPress={() => {}} // No action in preview mode
                />
                <Text style={styles.optionText}>Yes</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="no"
                  status="unchecked"
                  onPress={() => {}} // No action in preview mode
                />
                <Text style={styles.optionText}>No</Text>
              </View>
            </View>
          </Section>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Form Preview"
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
        <Text style={styles.formTitle}>{questionnaire.name}</Text>
        {questionnaire.questions.map((question, index) => renderQuestion(question, index))}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  optionText: {
    marginLeft: 10,
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});