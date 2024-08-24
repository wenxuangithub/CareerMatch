import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
  TextInput,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getAuth } from "firebase/auth";

type Document = {
  name: string;
  type: "pdf" | "image" | "embed link";
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
  eventName: string;
  location: string;
  companyName: string;
  documents: Document[];
  jobs: Job[];
};

const { width, height } = Dimensions.get("window");

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
  const [newDocument, setNewDocument] = useState<Document>({
    name: "",
    type: "pdf",
    content: "",
  });
  const [newJob, setNewJob] = useState<Job>({
    role: "",
    location: "",
    classification: "",
    descriptions: "",
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [showRenameDocumentModal, setShowRenameDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingJobIndex, setEditingJobIndex] = useState<number | null>(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const companyDocRef = doc(db, "companies", companyId);
      const [eventSnap, companySnap] = await Promise.all([
        getDoc(eventDocRef),
        getDoc(companyDocRef),
      ]);

      if (eventSnap.exists() && companySnap.exists()) {
        const eventDetails = eventSnap.data();
        const companyDetails = companySnap.data();

        const eventDocumentsRef = doc(
          db,
          "EventDocuments",
          `${eventId}_${companyId}`
        );
        const eventDocumentsSnap = await getDoc(eventDocumentsRef);

        setEventData({
          eventName: eventDetails.name,
          location: eventDetails.location,
          companyName: companyDetails.name,
          documents: eventDocumentsSnap.exists()
            ? eventDocumentsSnap.data().documents
            : [],
          jobs: eventDocumentsSnap.exists()
            ? eventDocumentsSnap.data().jobs
            : [],
        });
      } else {
        Alert.alert("Error", "Event or company not found");
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      Alert.alert("Error", "Failed to fetch event data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilePicker = async (type: "pdf" | "image") => {
    try {
      let result;
      if (type === "pdf") {
        result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(result);
        setFileName(file.name);
        setNewDocument({
          ...newDocument,
          type: type,
          name: file.name,
        });
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const uploadFile = async (uri: string, type: "pdf" | "image") => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = type === "pdf" ? "pdf" : "jpg";
    const filename = `eventDocuments/${eventId}_${companyId}/${Date.now()}_${fileName}.${extension}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleAddDocument = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to add a document.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!eventData || !selectedFile) return;

      let content = "";
      if (newDocument.type === "pdf" || newDocument.type === "image") {
        if (selectedFile.assets && selectedFile.assets.length > 0) {
          content = await uploadFile(
            selectedFile.assets[0].uri,
            newDocument.type
          );
        }
      } else {
        content = newDocument.content; // For embed links, use the content directly
      }

      if (content) {
        const updatedDocuments = [
          ...eventData.documents,
          { ...newDocument, name: fileName, content },
        ];
        await updateEventData({ ...eventData, documents: updatedDocuments });
        setNewDocument({ name: "", type: "pdf", content: "" });
        setSelectedFile(null);
        setFileName("");
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      Alert.alert("Error", "Failed to add document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJob = (job: Job, index: number) => {
    setEditingJob({ ...job });
    setEditingJobIndex(index);
    setShowEditJobModal(true);
  };

  const saveEditedJob = async () => {
    if (!eventData || !editingJob || editingJobIndex === null) return;

    try {
      const updatedJobs = [...eventData.jobs];
      updatedJobs[editingJobIndex] = editingJob;
      
      await updateEventData({ ...eventData, jobs: updatedJobs });
      setEventData(prevData => ({
        ...prevData!,
        jobs: updatedJobs
      }));
      setShowEditJobModal(false);
      setEditingJob(null);
      setEditingJobIndex(null);
    } catch (error) {
      console.error("Error updating job:", error);
      Alert.alert("Error", "Failed to update job. Please try again.");
    }
  };

  const handleRenameDocument = (document: Document) => {
    setEditingDocument(document);
    setNewDocumentName(document.name);
    setShowRenameDocumentModal(true);
  };

  const handleAddJob = async () => {
    setIsSubmitting(true);
    try {
      if (!eventData) return;

      const updatedJobs = [...eventData.jobs, newJob];
      await updateEventData({ ...eventData, jobs: updatedJobs });
      setNewJob({
        role: "",
        location: "",
        classification: "",
        descriptions: "",
        time: "",
      });
      setShowJobModal(false);
    } catch (error) {
      console.error("Error adding job:", error);
      Alert.alert("Error", "Failed to add job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEventData = async (newData: EventData) => {
    const eventDocRef = doc(db, "EventDocuments", `${eventId}_${companyId}`);
    await setDoc(eventDocRef, newData, { merge: true });
    setEventData(newData);
  };

  const renderDocumentItem = ({
    item,
    index,
  }: {
    item: Document;
    index: number;
  }) => (
    <TouchableOpacity onPress={() => handleRenameDocument(item)}>
      <View style={styles.linkItem}>
        <Ionicons
          name={
            item.type === "pdf"
              ? "document"
              : item.type === "image"
              ? "image"
              : "link"
          }
          size={24}
          color={themeColor.primary}
          style={styles.linkIcon}
        />
        <View style={styles.linkTextContainer}>
          <Text style={styles.linkName}>{item.name}</Text>
          <Text style={styles.linkUrl}>{item.content.substring(0, 30)}...</Text>
        </View>
        <View style={styles.linkActions}>
          <TouchableOpacity
            onPress={() => handleDeleteDocument(index)}
            style={styles.actionButton}
          >
            <Ionicons name="close-circle" size={24} color={themeColor.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderJobItem = ({ item, index }: { item: Job; index: number }) => (
    <TouchableOpacity onPress={() => handleEditJob(item, index)}>
      <View style={styles.jobItem}>
        <Text style={styles.jobRole}>{item.role}</Text>
        <Text>{item.location}</Text>
        <Text>{item.classification}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteJob(index)}
          style={styles.actionButton}
        >
          <Ionicons name="close-circle" size={24} color={themeColor.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const saveRenamedDocument = async () => {
    if (!eventData || !editingDocument) return;

    try {
      const updatedDocuments = eventData.documents.map((doc) =>
        doc.content === editingDocument.content
          ? { ...doc, name: newDocumentName }
          : doc
      );
      await updateEventData({ ...eventData, documents: updatedDocuments });
      setShowRenameDocumentModal(false);
      setEditingDocument(null);
      setNewDocumentName("");
    } catch (error) {
      console.error("Error renaming document:", error);
      Alert.alert("Error", "Failed to rename document. Please try again.");
    }
  };

  const handleDeleteDocument = async (index: number) => {
    try {
      if (!eventData) return;
      const documentToDelete = eventData.documents[index];

      // Delete from Storage
      if (documentToDelete.type !== "embed link") {
        const storageRef = ref(storage, documentToDelete.content);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      const updatedDocuments = [...eventData.documents];
      updatedDocuments.splice(index, 1);
      await updateEventData({ ...eventData, documents: updatedDocuments });
    } catch (error) {
      console.error("Error deleting document:", error);
      Alert.alert("Error", "Failed to delete document. Please try again.");
    }
  };

  const handleDeleteJob = async (index: number) => {
    try {
      if (!eventData) return;
      const updatedJobs = [...eventData.jobs];
      updatedJobs.splice(index, 1);
      await updateEventData({ ...eventData, jobs: updatedJobs });
      setEventData(prevData => ({
        ...prevData!,
        jobs: updatedJobs
      }));
    } catch (error) {
      console.error("Error deleting job:", error);
      Alert.alert("Error", "Failed to delete job. Please try again.");
    }
  };
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
            <Text style={styles.sectionTitle}>Event Details</Text>
            <Text>Event: {eventData?.eventName}</Text>
            <Text>Location: {eventData?.location}</Text>
            <Text>Company: {eventData?.companyName}</Text>
          </View>

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
            <Text style={styles.sectionTitle}>Jobs</Text>
            <Button
              text="Add Job"
              onPress={() => setShowJobModal(true)}
              style={styles.addButton}
            />
            <FlatList
              data={eventData?.jobs}
              renderItem={renderJobItem}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={<Text>No jobs added yet</Text>}
            />
          </View>
        </View>
      )}

      <Modal
        visible={showDocumentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Document</Text>
            <View style={styles.buttonContainer}>
              <Button
                text="PDF"
                onPress={() => handleFilePicker("pdf")}
                style={styles.fileButton}
              />
              <Button
                text="Image"
                onPress={() => handleFilePicker("image")}
                style={styles.fileButton}
              />
              <Button
                text="Link"
                onPress={() =>
                  setNewDocument({ ...newDocument, type: "embed link" })
                }
                style={styles.fileButton}
              />
            </View>
            {selectedFile && (
              <Text style={styles.selectedFileName}>Selected: {fileName}</Text>
            )}
            {newDocument.type === "embed link" && (
              <TextInput
                placeholder="Embed Link"
                value={newDocument.content}
                onChangeText={(text) =>
                  setNewDocument({ ...newDocument, content: text })
                }
                style={styles.input}
              />
            )}
            {(selectedFile || newDocument.type === "embed link") && (
              <Button
                text={isSubmitting ? "Uploading..." : "Add Document"}
                onPress={handleAddDocument}
                disabled={isSubmitting}
                style={styles.modalButton}
              />
            )}
            <Button
              text="Cancel"
              status="danger"
              onPress={() => {
                setShowDocumentModal(false);
                setSelectedFile(null);
                setNewDocument({ name: "", type: "pdf", content: "" });
                setFileName("");
              }}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditJobModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Job</Text>
            <TextInput
              placeholder="Role"
              value={editingJob?.role}
              onChangeText={(text) =>
                setEditingJob((prev) => (prev ? { ...prev, role: text } : null))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Location"
              value={editingJob?.location}
              onChangeText={(text) =>
                setEditingJob((prev) =>
                  prev ? { ...prev, location: text } : null
                )
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Classification"
              value={editingJob?.classification}
              onChangeText={(text) =>
                setEditingJob((prev) =>
                  prev ? { ...prev, classification: text } : null
                )
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={editingJob?.descriptions}
              onChangeText={(text) =>
                setEditingJob((prev) =>
                  prev ? { ...prev, descriptions: text } : null
                )
              }
              style={styles.input}
              multiline
            />
            <TextInput
              placeholder="Time"
              value={editingJob?.time}
              onChangeText={(text) =>
                setEditingJob((prev) => (prev ? { ...prev, time: text } : null))
              }
              style={styles.input}
            />
            <Button
              text="Save Changes"
              onPress={saveEditedJob}
              style={styles.modalButton}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => {
                setShowEditJobModal(false);
                setEditingJob(null);
              }}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRenameDocumentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Document</Text>
            <TextInput
              placeholder="New Document Name"
              value={newDocumentName}
              onChangeText={setNewDocumentName}
              style={styles.input}
            />
            <Button
              text="Save"
              onPress={saveRenamedDocument}
              style={styles.modalButton}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => {
                setShowRenameDocumentModal(false);
                setEditingDocument(null);
                setNewDocumentName("");
              }}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showEditJobModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Job</Text>
            <TextInput
              placeholder="Role"
              value={editingJob?.role}
              onChangeText={(text) => setEditingJob(prev => prev ? {...prev, role: text} : null)}
              style={styles.input}
            />
            <TextInput
              placeholder="Location"
              value={editingJob?.location}
              onChangeText={(text) => setEditingJob(prev => prev ? {...prev, location: text} : null)}
              style={styles.input}
            />
            <TextInput
              placeholder="Classification"
              value={editingJob?.classification}
              onChangeText={(text) => setEditingJob(prev => prev ? {...prev, classification: text} : null)}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={editingJob?.descriptions}
              onChangeText={(text) => setEditingJob(prev => prev ? {...prev, descriptions: text} : null)}
              style={styles.input}
              multiline
            />
            <TextInput
              placeholder="Time"
              value={editingJob?.time}
              onChangeText={(text) => setEditingJob(prev => prev ? {...prev, time: text} : null)}
              style={styles.input}
            />
            <Button
              text="Save Changes"
              onPress={saveEditedJob}
              style={styles.modalButton}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => {
                setShowEditJobModal(false);
                setEditingJob(null);
                setEditingJobIndex(null);
              }}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColor.gray200,
  },
  jobItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColor.gray200,
  },
  linkIcon: {
    marginRight: 10,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkName: {
    fontWeight: "bold",
  },
  linkUrl: {
    fontSize: 12,
    color: themeColor.gray,
  },
  jobRole: {
    fontWeight: "bold",
    flex: 1,
  },
  linkActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 8,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  fileButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectedFileName: {
    color: "#fff",
    marginBottom: 12,
  },
  modalButton: {
    marginTop: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#444",
    borderRadius: 5,
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: themeColor.primary,
    borderRadius: 5,
  },
});
