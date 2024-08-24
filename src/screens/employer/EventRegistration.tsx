import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button, TextInput } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Document = {
  type: 'pdf' | 'image' | 'embed link';
  content: string;
};

type Job = {
  role: string;
  location: string;
  classification: string;
  descriptions: string;
  time: string;
};

type EventData = {
  eventId: string;
  companyId: string;
  documents: Document[];
  jobs: Job[];
};

const { width, height } = Dimensions.get('window');

export default function EmployerEventPanel({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EmployerEventPanel">) {
  const { isDarkmode } = useTheme();
  const { eventId, companyId } = route.params;
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [newDocument, setNewDocument] = useState<Document>({ type: 'pdf', content: '' });
  const [newJob, setNewJob] = useState<Job>({ role: '', location: '', classification: '', descriptions: '', time: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const eventDocRef = doc(db, "employerEventData", `${eventId}_${companyId}`);
      const eventDocSnap = await getDoc(eventDocRef);
      
      if (eventDocSnap.exists()) {
        setEventData(eventDocSnap.data() as EventData);
      } else {
        // Initialize with empty arrays if document doesn't exist
        setEventData({
          eventId,
          companyId,
          documents: [],
          jobs: []
        });
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      Alert.alert("Error", "Failed to fetch event data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    setIsSubmitting(true);
    try {
      if (!eventData) return;

      let content = '';
      if (newDocument.type === 'pdf') {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (result.type === 'success') {
          content = await uploadFile(result.uri, 'pdf');
        }
      } else if (newDocument.type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
        if (!result.canceled && result.assets[0].uri) {
          content = await uploadFile(result.assets[0].uri, 'image');
        }
      } else {
        content = newDocument.content; // For embed links, use the content directly
      }

      if (content) {
        const updatedDocuments = [...eventData.documents, { ...newDocument, content }];
        await updateEventData({ ...eventData, documents: updatedDocuments });
        setNewDocument({ type: 'pdf', content: '' });
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      Alert.alert("Error", "Failed to add document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddJob = async () => {
    setIsSubmitting(true);
    try {
      if (!eventData) return;

      const updatedJobs = [...eventData.jobs, newJob];
      await updateEventData({ ...eventData, jobs: updatedJobs });
      setNewJob({ role: '', location: '', classification: '', descriptions: '', time: '' });
      setShowJobModal(false);
    } catch (error) {
      console.error("Error adding job:", error);
      Alert.alert("Error", "Failed to add job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadFile = async (uri: string, type: 'pdf' | 'image'): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `${type}s/${eventId}_${companyId}/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const updateEventData = async (newData: EventData) => {
    const eventDocRef = doc(db, "employerEventData", `${eventId}_${companyId}`);
    await setDoc(eventDocRef, newData);
    setEventData(newData);
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <View style={styles.listItem}>
      <Text>{item.type}</Text>
      <Text>{item.content.substring(0, 30)}...</Text>
    </View>
  );

  const renderJobItem = ({ item }: { item: Job }) => (
    <View style={styles.listItem}>
      <Text>{item.role}</Text>
      <Text>{item.location}</Text>
      <Text>{item.classification}</Text>
    </View>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Event Panel"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColor.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Button
              text="Add Document"
              onPress={() => setShowDocumentModal(true)}
              style={styles.addButton}
            />
            <FlatList
              data={eventData?.documents}
              renderItem={renderDocumentItem}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={<Text>No documents added yet</Text>}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Roles</Text>
            <Button
              text="Add Job Role"
              onPress={() => setShowJobModal(true)}
              style={styles.addButton}
            />
            <FlatList
              data={eventData?.jobs}
              renderItem={renderJobItem}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={<Text>No job roles added yet</Text>}
            />
          </View>
        </View>
      )}

      <Modal visible={showDocumentModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Document</Text>
            <Button
              text={`Type: ${newDocument.type}`}
              onPress={() => setNewDocument({...newDocument, type: newDocument.type === 'pdf' ? 'image' : newDocument.type === 'image' ? 'embed link' : 'pdf'})}
              style={styles.modalButton}
            />
            {newDocument.type === 'embed link' && (
              <TextInput
                placeholder="Embed Link"
                value={newDocument.content}
                onChangeText={(text) => setNewDocument({...newDocument, content: text})}
                style={styles.input}
              />
            )}
            <Button
              text={isSubmitting ? "Adding..." : "Add Document"}
              onPress={handleAddDocument}
              disabled={isSubmitting}
              style={styles.modalButton}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => setShowDocumentModal(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showJobModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Job Role</Text>
            <TextInput
              placeholder="Role"
              value={newJob.role}
              onChangeText={(text) => setNewJob({...newJob, role: text})}
              style={styles.input}
            />
            <TextInput
              placeholder="Location"
              value={newJob.location}
              onChangeText={(text) => setNewJob({...newJob, location: text})}
              style={styles.input}
            />
            <TextInput
              placeholder="Classification"
              value={newJob.classification}
              onChangeText={(text) => setNewJob({...newJob, classification: text})}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={newJob.descriptions}
              onChangeText={(text) => setNewJob({...newJob, descriptions: text})}
              style={styles.input}
              multiline
            />
            <TextInput
              placeholder="Time"
              value={newJob.time}
              onChangeText={(text) => setNewJob({...newJob, time: text})}
              style={styles.input}
            />
            <Button
              text={isSubmitting ? "Adding..." : "Add Job Role"}
              onPress={handleAddJob}
              disabled={isSubmitting}
              style={styles.modalButton}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => setShowJobModal(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addButton: {
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  input: {
    backgroundColor: '#444',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    color: '#fff',
  },
  modalButton: {
    marginTop: 8,
  },
});