import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as DocumentPicker from 'expo-document-picker';
import { useGeminiAI } from '../../hooks/useGeminiAI';

type AnalysisResult = {
  overall_impression: string;
  pros: string[];
  cons: string[];
  suggestions: string[];
  error?: string;
};

export default function ResumeAnalysis({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "ResumeAnalysis">) {
  const { isDarkmode } = useTheme();
  const [preUploadedResumeUrl, setPreUploadedResumeUrl] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<DocumentPicker.DocumentResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { loading, error, analyzeResume } = useGeminiAI();

  useEffect(() => {
    fetchUserResumeUrl();
  }, []);

  const fetchUserResumeUrl = async () => {
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, "user", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPreUploadedResumeUrl(userData.pdfURL || null);
      }
    }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedResume(result);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAnalyzeResume = async () => {
    if (!preUploadedResumeUrl && !selectedResume) {
      Alert.alert('Error', 'Please upload a resume or use your pre-uploaded resume');
      return;
    }

    try {
      const resumeUrl = selectedResume?.assets?.[0]?.uri || preUploadedResumeUrl;
      if (!resumeUrl) {
        throw new Error('No resume URL available');
      }

      const result = await analyzeResume(resumeUrl);
      if (result) {
        const parsedResult = JSON.parse(result);
        if (parsedResult.error) {
          Alert.alert('Error', parsedResult.error);
        } else {
          setAnalysis(parsedResult);
        }
      } else {
        Alert.alert('Error', 'Failed to analyze resume');
      }
    } catch (err) {
      console.error('Error analyzing resume:', err);
      Alert.alert('Error', 'Failed to analyze resume. Please try again.');
    }
  };

  const renderListItem = (item: string, icon: string, color: string) => (
    <View style={styles.listItem} key={item}>
      <Text style={styles.listItemText}>{item}</Text>
      <Ionicons name={icon} size={24} color={color} />
    </View>
  );

  const renderAnalysisSection = (title: string, items: string[] | undefined, icon: string, color: string) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items && items.length > 0 ? (
        items.map(item => renderListItem(item, icon, color))
      ) : (
        <Text style={styles.noDataText}>No data available</Text>
      )}
    </>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Resume Analysis"
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
        {preUploadedResumeUrl && (
          <TouchableOpacity 
            style={styles.preUploadedResumeButton}
            onPress={() => setSelectedResume(null)}
          >
            <Text>Use Pre-uploaded Resume</Text>
          </TouchableOpacity>
        )}
        <Button
          text="Upload New Resume"
          onPress={handleUploadResume}
          style={styles.uploadButton}
        />
        {selectedResume && (
          <Text style={styles.selectedResumeText}>
            Selected: {selectedResume.assets?.[0]?.name || 'Resume'}
          </Text>
        )}
        <Button
          text={loading ? "Analyzing..." : "Analyze Resume"}
          onPress={handleAnalyzeResume}
          style={styles.analyzeButton}
          disabled={loading}
        />
        {analysis && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>Analysis Result:</Text>
            <Text style={styles.overallImpression}>{analysis.overall_impression || "No overall impression available"}</Text>
            
            {renderAnalysisSection("Strengths:", analysis.pros, 'checkmark-circle', 'green')}
            {renderAnalysisSection("Areas for Improvement:", analysis.cons, 'alert-circle', 'red')}
            {renderAnalysisSection("Suggestions:", analysis.suggestions, 'bulb', 'orange')}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  preUploadedResumeButton: {
    padding: 10,
    backgroundColor: themeColor.gray200,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  uploadButton: {
    marginBottom: 10,
  },
  selectedResumeText: {
    marginBottom: 10,
  },
  analyzeButton: {
    marginBottom: 20,
  },
  analysisContainer: {
    backgroundColor: themeColor.gray100,
    padding: 15,
    borderRadius: 5,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overallImpression: {
    fontSize: 16,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  listItemText: {
    flex: 1,
    marginRight: 10,
  },
  noDataText: {
    fontStyle: 'italic',
    color: themeColor.gray,
  },
});
