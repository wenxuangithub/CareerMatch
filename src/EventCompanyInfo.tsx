import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";

type EventData = {
  eventName: string;
  location: string;
  companyName: string;
  documents: Array<{
    name: string;
    type: 'pdf' | 'image' | 'embed link';
    content: string;
  }>;
  jobs: Array<{
    role: string;
    location: string;
    classification: string;
    descriptions: string;
    time: string;
  }>;
};

export default function EventCompanyInfo({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventCompanyInfo">) {
  const { isDarkmode } = useTheme();
  const { eventId, companyId } = route.params;
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore();

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const eventDocRef = doc(db, "EventDocuments", `${eventId}_${companyId}`);
      const eventDocSnap = await getDoc(eventDocRef);

      if (eventDocSnap.exists()) {
        setEventData(eventDocSnap.data() as EventData);
      } else {
        Alert.alert("Error", "Event information not found");
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      Alert.alert("Error", "Failed to fetch event information");
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = (document: { type: string; content: string }) => {
    Linking.openURL(document.content).catch((err) => 
      Alert.alert("Error", "Couldn't open the document")
    );
  };

  const openJobDetails = (job: EventData['jobs'][0]) => {
    navigation.navigate("JobDetails", { job, companyName: eventData?.companyName });
  };

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <Text>Loading event information...</Text>
        </View>
      </Layout>
    );
  }

  

  return (
    <Layout>
      <TopNav
        middleContent="Event & Company Info"
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <Text>Event: {eventData?.eventName}</Text>
          <Text>Location: {eventData?.location}</Text>
          <Text>Company: {eventData?.companyName}</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {eventData?.documents.map((doc, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.documentItem}
              onPress={() => openDocument(doc)}
            >
              <Ionicons
                name={doc.type === 'pdf' ? 'document' : doc.type === 'image' ? 'image' : 'link'}
                size={24}
                color={themeColor.primary}
              />
              <Text style={styles.documentName}>{doc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Openings</Text>
          {eventData?.jobs.map((job, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.jobItem}
              onPress={() => openJobDetails(job)}
            >
              <Text style={styles.jobRole}>{job.role}</Text>
              <Text>{job.location}</Text>
              <Text>{job.classification}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColor.gray200,
  },
  documentName: {
    marginLeft: 10,
  },
  jobItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: themeColor.gray100,
    borderRadius: 5,
  },
  jobRole: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jobDescription: {
    marginTop: 5,
    fontStyle: 'italic',
  },
  
});