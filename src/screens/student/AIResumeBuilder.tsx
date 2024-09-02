import React, { useState, useEffect } from 'react';
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
import { Button as PaperButton } from 'react-native-paper';
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { useGeminiAI } from '../../hooks/useGeminiAI';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
  const [isResumeGenerated, setIsResumeGenerated] = useState(false);
  const [generatedResumeContent, setGeneratedResumeContent] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, "user", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserInput(prevState => ({
          ...prevState,
          fullName: userData.displayName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          education: userData.education || '',
        }));
      }
    }
  };

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
      const generatedResumeContent = await generateResume(userInput);
      
      if (error) {
        Alert.alert('Error', error);
      } else if (generatedResumeContent) {
        setGeneratedResumeContent(generatedResumeContent);
        setIsResumeGenerated(true);
        Alert.alert('Success', 'Resume generated successfully!');
      } else {
        Alert.alert('Error', 'Failed to generate resume. Please try again.');
      }
    } catch (err) {
      console.error('Error generating resume:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleViewResume = () => {
    navigation.navigate('ResumePreview', { resume: generatedResumeContent });
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
                  <PaperButton
                    key={industry}
                    mode={userInput.targetIndustry === industry ? "contained" : "outlined"}
                    onPress={() => handleInputChange('targetIndustry', industry)}
                    style={styles.industryButton}
                    labelStyle={styles.industryButtonLabel}
                  >
                    {industry}
                  </PaperButton>
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

          {isResumeGenerated && (
            <Button
              text="View Resume"
              onPress={handleViewResume}
              style={styles.viewResumeButton}
            />
          )}
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
  industryButtonLabel: {
    fontSize: 12,
  },
  generateButton: {
    marginTop: 20,
  },
  viewResumeButton: {
    marginTop: 10,
  },
});