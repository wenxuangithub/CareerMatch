import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
  TextInput,
  Section,
  SectionContent,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { useGeminiAI } from '../../hooks/useGeminiAI';

// Define the industries available for resume tailoring
const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Marketing",
  "Hospitality",
];

// Define the structure for user input
type UserInput = {
  fullName: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  skills: string;
  targetIndustry: string;
};

export default function AIResumeBuilder({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "AIResumeBuilder">) {
  const { isDarkmode } = useTheme();
  const [userInput, setUserInput] = useState<UserInput>({
    fullName: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    skills: '',
    targetIndustry: '',
  });
  const { generatedResume, loading, error, generateResume } = useGeminiAI();

  // Handle input changes
  const handleInputChange = (key: keyof UserInput, value: string) => {
    setUserInput((prev) => ({ ...prev, [key]: value }));
  };

  // Generate resume using AI
  const handleGenerateResume = async () => {
    // Validate input
    if (Object.values(userInput).some(value => value.trim() === '')) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await generateResume(userInput);
      
      if (error) {
        Alert.alert('Error', error);
      } else if (generatedResume) {
        // Navigate to a new screen to display the generated resume
        navigation.navigate('ResumePreview', { resume: generatedResume });
      }
    } catch (err) {
      console.error('Error generating resume:', err);
      Alert.alert('Error', 'Failed to generate resume. Please try again.');
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="AI Resume Builder"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Section>
            <SectionContent>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <TextInput
                placeholder="Full Name"
                value={userInput.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                style={styles.input}
              />
              <TextInput
                placeholder="Email"
                value={userInput.email}
                onChangeText={(text) => handleInputChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Phone"
                value={userInput.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </SectionContent>
          </Section>

          <Section>
            <SectionContent>
              <Text style={styles.sectionTitle}>Education</Text>
              <TextInput
                placeholder="Education (e.g., Degree, Institution, Year)"
                value={userInput.education}
                onChangeText={(text) => handleInputChange('education', text)}
                style={styles.input}
                multiline
              />
            </SectionContent>
          </Section>

          <Section>
            <SectionContent>
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <TextInput
                placeholder="Work Experience (e.g., Job Title, Company, Duration)"
                value={userInput.experience}
                onChangeText={(text) => handleInputChange('experience', text)}
                style={styles.input}
                multiline
              />
            </SectionContent>
          </Section>

          <Section>
            <SectionContent>
              <Text style={styles.sectionTitle}>Skills</Text>
              <TextInput
                placeholder="Skills (comma-separated)"
                value={userInput.skills}
                onChangeText={(text) => handleInputChange('skills', text)}
                style={styles.input}
                multiline
              />
            </SectionContent>
          </Section>

          <Section>
            <SectionContent>
              <Text style={styles.sectionTitle}>Target Industry</Text>
              <View style={styles.industryContainer}>
                {INDUSTRIES.map((industry) => (
                  <Button
                    key={industry}
                    text={industry}
                    onPress={() => handleInputChange('targetIndustry', industry)}
                    style={[
                      styles.industryButton,
                      userInput.targetIndustry === industry && styles.selectedIndustry,
                    ]}
                    textStyle={
                      userInput.targetIndustry === industry
                        ? styles.selectedIndustryText
                        : {}
                    }
                  />
                ))}
              </View>
            </SectionContent>
          </Section>

          <Button
            text={loading ? "Generating..." : "Generate Resume"}
            onPress={handleGenerateResume}
            style={styles.generateButton}
            disabled={loading}
          />
          <Button
          text={'View'}
          onPress = {() =>  navigation.navigate('ResumePreview', { resume: generatedResume } )}/>
        </ScrollView>
      </KeyboardAvoidingView>
      </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  industryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  industryButton: {
    width: '48%',
    marginBottom: 10,
  },
  selectedIndustry: {
    backgroundColor: themeColor.primary,
  },
  selectedIndustryText: {
    color: themeColor.white,
  },
  generateButton: {
    marginTop: 20,
  },
});