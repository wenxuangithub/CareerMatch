import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, Layout, TopNav, useTheme, themeColor, Button } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { useGeminiAI } from '../../hooks/useGeminiAI';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

type Job = {
  classification: string;
  descriptions: string;
  location: string;
  role: string;
  tags: string[];
  time: string;
};

export default function AIJobRecommendation({ route, navigation }: NativeStackScreenProps<MainStackParamList, "AIJobRecommendation">) {
  const { isDarkmode } = useTheme();
  const { jobs } = route.params;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fetchingPdf, setFetchingPdf] = useState<boolean>(true);
  const { recommendation, loading, error, getRecommendation } = useGeminiAI();

  useEffect(() => {
    fetchPdfUrl();
  }, []);

  const fetchPdfUrl = async () => {
    setFetchingPdf(true);
    const auth = getAuth();
    const db = getFirestore();
    
    if (auth.currentUser) {
      const userDoc = doc(db, 'user', auth.currentUser.uid);
      try {
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setPdfUrl(userData.pdfURL || null);
        }
      } catch (error) {
        console.error('Error fetching PDF URL:', error);
        Alert.alert('Error', 'Failed to fetch your resume. Please try again later.');
      }
    }
    setFetchingPdf(false);
  };

  const handleGetRecommendation = async () => {
    if (pdfUrl) {
      try {
        await getRecommendation(pdfUrl, jobs);
      } catch (error) {
        console.error('Error getting recommendation:', error);
        Alert.alert('Error', 'Failed to analyze your resume. Please try again later.');
      }
    } else {
      Alert.alert('Error', 'Resume not found. Please upload your resume first.');
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="AI Job Recommendation"
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
        <Text style={styles.title}>AI-Powered Job Recommendation</Text>
        <Text style={styles.description}>
          Our AI will analyze your resume and the available job positions to recommend the most suitable ones for you.
        </Text>
        {fetchingPdf ? (
          <ActivityIndicator size="small" color={themeColor.primary} />
        ) : pdfUrl ? (
          <Button
            text="Get Recommendation"
            onPress={handleGetRecommendation}
            style={styles.button}
            disabled={loading}
          />
        ) : (
          <Text style={styles.errorText}>Resume not found. Please upload your resume first.</Text>
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor.primary} />
            <Text style={styles.loadingText}>Analyzing your resume and job positions...</Text>
          </View>
        )}
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
        {recommendation && (
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>Recommended Jobs:</Text>
            {recommendation.map((job, index) => (
              <View key={index} style={styles.jobItem}>
                <Text style={styles.jobRole}>{job.role}</Text>
                <Text style={styles.jobDescription}>{job.descriptions}</Text>
                <Text style={styles.jobLocation}>Location: {job.location}</Text>
                <View style={styles.tagsContainer}>
                  {job.tags.map((tag, tagIndex) => (
                    <Text key={tagIndex} style={styles.tag}>{tag}</Text>
                  ))}
                </View>
              </View>
            ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 20,
  },
  recommendationContainer: {
    marginTop: 20,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 15,
  },
  jobRole: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  jobDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  jobLocation: {
    fontSize: 14,
    marginBottom: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: themeColor.primary,
    color: 'white',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 12,
  },
});