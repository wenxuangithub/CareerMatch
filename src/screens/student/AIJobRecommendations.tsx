import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import { Text, Layout, TopNav, useTheme, themeColor, Button } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { useGeminiAI } from '../../hooks/useGeminiAI';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

interface Job {
  companyName: string;
  role: string;
  tags: string[];
  matchReason: string;
  matchScore: string;
  detailedAnalysis: string;
}

interface SavedRecommendation {
  userId: string;
  eventId: string;
  recommendations: Job[];
  timestamp: Date;
}

export default function AIJobRecommendation({ route, navigation }: NativeStackScreenProps<MainStackParamList, "AIJobRecommendation">) {
  const { isDarkmode } = useTheme();
  const { jobs, eventId } = route.params;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fetchingPdf, setFetchingPdf] = useState<boolean>(true);
  const { recommendation, loading, error, getRecommendation } = useGeminiAI();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [savedRecommendation, setSavedRecommendation] = useState<SavedRecommendation | null>(null);
  const [savingRecommendation, setSavingRecommendation] = useState<boolean>(false);

  useEffect(() => {
    fetchPdfUrl();
    fetchSavedRecommendation();
  }, []);

  const fetchPdfUrl = async () => {
    setFetchingPdf(true);
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      const userDoc = doc(db, "user", auth.currentUser.uid);
      try {
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setPdfUrl(userData.pdfURL || null);
        }
      } catch (error) {
        console.error("Error fetching PDF URL:", error);
        Alert.alert(
          "Error",
          "Failed to fetch your resume. Please try again later."
        );
      }
    }
    setFetchingPdf(false);
  };

  const fetchSavedRecommendation = async () => {
    const auth = getAuth();
    const db = getFirestore();
    
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'AIJobRecommendation', `${auth.currentUser.uid}_${eventId}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SavedRecommendation;
          setSavedRecommendation({
            ...data,
            timestamp: data.timestamp.toDate()
          });
        }
      } catch (error) {
        console.error('Error fetching saved recommendation:', error);
      }
    }
  };

  const handleGetRecommendation = async () => {
    if (pdfUrl) {
      try {
        await getRecommendation(pdfUrl, jobs);
        setSavedRecommendation(null); // Clear saved recommendations when getting new ones
      } catch (error) {
        console.error('Error getting recommendation:', error);
        Alert.alert('Error', 'Failed to analyze your resume. Please try again later.');
      }
    } else {
      Alert.alert('Error', 'Resume not found. Please upload your resume first.');
    }
  };

  const handleSaveRecommendation = async () => {
    const auth = getAuth();
    const db = getFirestore();
    
    if (auth.currentUser && recommendation.length > 0) {
      setSavingRecommendation(true);
      try {
        const docRef = doc(db, 'AIJobRecommendation', `${auth.currentUser.uid}_${eventId}`);
        const newRecommendation: SavedRecommendation = {
          userId: auth.currentUser.uid,
          eventId: eventId,
          recommendations: recommendation,
          timestamp: new Date()
        };
        await setDoc(docRef, newRecommendation);
        setSavedRecommendation(newRecommendation);
        Alert.alert('Success', 'Recommendations saved successfully!');
      } catch (error) {
        console.error('Error saving recommendations:', error);
        Alert.alert('Error', 'Failed to save recommendations. Please try again.');
      } finally {
        setSavingRecommendation(false);
      }
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'Excellent':
        return 'green';
      case 'Average':
        return 'yellow';
      case 'Poor':
        return 'red';
      default:
        return 'black';
    }
  };

  const renderJobList = (jobs: Job[]) => (
    <>
      {jobs.map((job, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.jobItem}
          onPress={() => {
            setSelectedJob(job);
            setModalVisible(true);
          }}
        >
          <Text style={styles.jobRole}>{job.role}</Text>
          <Text style={styles.companyName}>{job.companyName}</Text>
          <Text style={[styles.matchScore, { color: getScoreColor(job.matchScore) }]}>
            Match: {job.matchScore}
          </Text>
          <View style={styles.tagsContainer}>
            {job.tags && job.tags.map((tag, tagIndex) => (
              <Text key={tagIndex} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

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
        {savedRecommendation ? (
          <>
            <Text style={styles.lastUpdated}>
              Last updated: {savedRecommendation.timestamp.toLocaleString()}
            </Text>
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationTitle}>Saved Recommendations:</Text>
              {renderJobList(savedRecommendation.recommendations)}
            </View>
            <Button
              text="Get New Recommendations"
              onPress={handleGetRecommendation}
              style={styles.button}
              disabled={loading}
            />
          </>
        ) : fetchingPdf ? (
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
        {recommendation.length > 0 && !savedRecommendation && (
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>Recommended Jobs:</Text>
            {renderJobList(recommendation)}
            <Button
              text={savingRecommendation ? "Saving..." : "Save Recommendations"}
              onPress={handleSaveRecommendation}
              style={styles.saveButton}
              disabled={savingRecommendation}
            />
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedJob?.role}</Text>
            <Text style={styles.modalCompany}>{selectedJob?.companyName}</Text>
            <Text style={[styles.modalMatchScore, { color: getScoreColor(selectedJob?.matchScore || '') }]}>
              Match: {selectedJob?.matchScore}
            </Text>
            <Text style={styles.modalSubtitle}>Match Reason:</Text>
            <Text style={styles.modalText}>{selectedJob?.matchReason}</Text>
            <Text style={styles.modalSubtitle}>Detailed Analysis:</Text>
            <Text style={styles.modalText}>{selectedJob?.detailedAnalysis}</Text>
            <Button
              text="Close"
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            />
          </ScrollView>
        </View>
      </Modal>
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
    fontWeight: "bold",
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
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginTop: 20,
  },
  recommendationContainer: {
    marginTop: 20,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  jobItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 15,
  },
  jobRole: {
    fontWeight: "bold",
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
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: themeColor.primary,
    color: "white",
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  saveButton: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#888',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalCompany: {
    fontSize: 18,
    marginBottom: 10,
  },
  modalMatchScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});
