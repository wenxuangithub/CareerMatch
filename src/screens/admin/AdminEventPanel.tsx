import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
};

type Application = {
  id: string;
  companyId: string;
  eventId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  companyName?: string;
  applicantName?: string; 
  position?: string;
};

export default function AdminEventPanel({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "AdminEventPanel">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editedEvent, setEditedEvent] = useState<Event | null>(null);
  const [assignedPosition, setAssignedPosition] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    fetchEventDetails();
    fetchApplications();
  }, []);

  const fetchEventDetails = async () => {
    setIsLoading(true);
    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        setEditedEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      Alert.alert("Error", "Failed to fetch event details");
    }
    setIsLoading(false);
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const applicationsRef = collection(db, "eventRegistrations");
      const q = query(
        applicationsRef,
        where("eventId", "==", eventId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const applicationList: Application[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const appData = docSnapshot.data() as Application;
        appData.id = docSnapshot.id;
        
        // Fetch company details
        const companyRef = doc(db, "companies", appData.companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          appData.companyName = companySnap.data().name;
        }

        // Fetch user details
        const userRef = doc(db, "user", appData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          appData.applicantName = userSnap.data().displayName;
          appData.position = userSnap.data().designation;
          
        }

        applicationList.push(appData);
      }

      setApplications(applicationList);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Alert.alert("Error", "Failed to fetch applications");
    }
    setIsLoading(false);
  };

  const handleEditEvent = async () => {
    if (editedEvent) {
      setIsEditing(true);
      try {
        await updateDoc(doc(db, "events", eventId), editedEvent);
        setEvent(editedEvent);
        setShowEditModal(false);
        Alert.alert("Success", "Event updated successfully");
      } catch (error) {
        console.error("Error updating event:", error);
        Alert.alert("Error", "Failed to update event");
      }
      setIsEditing(false);
    }
  };

  const handleApprove = async () => {
    if (selectedApplication) {
      setIsApproving(true);
      try {
        await updateDoc(doc(db, "eventRegistrations", selectedApplication.id), {
          status: "approved",
          assignedPosition: assignedPosition,
        });
        await sendNotification(
          selectedApplication.userId,
          "Your application has been approved!"
        );
        setShowApprovalModal(false);
        await fetchApplications();
        Alert.alert("Success", "Application approved successfully");
      } catch (error) {
        console.error("Error approving application:", error);
        Alert.alert("Error", "Failed to approve application");
      }
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (selectedApplication) {
      setIsRejecting(true);
      try {
        await updateDoc(doc(db, "eventRegistrations", selectedApplication.id), {
          status: "rejected",
          rejectReason: rejectReason,
        });
        await sendNotification(
          selectedApplication.userId,
          `Your application has been rejected. Reason: ${rejectReason}`
        );
        setShowApprovalModal(false);
        await fetchApplications();
        Alert.alert("Success", "Application rejected successfully");
      } catch (error) {
        console.error("Error rejecting application:", error);
        Alert.alert("Error", "Failed to reject application");
      }
      setIsRejecting(false);
    }
  };

  const sendNotification = async (userId: string, content: string) => {
    const notificationRef = doc(db, "Notifications", userId);
    const notificationSnap = await getDoc(notificationRef);
    if (notificationSnap.exists()) {
      await updateDoc(notificationRef, {
        notifications: [
          ...notificationSnap.data().notifications,
          {
            id: Date.now().toString(),
            content,
            byWho: "Admin",
            timestamp: Date.now(),
          },
        ],
      });
    } else {
      await setDoc(notificationRef, {
        notifications: [
          {
            id: Date.now().toString(),
            content,
            byWho: "Admin",
            timestamp: Date.now(),
          },
        ],
      });
    }
  };

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.applicationItem}
      onPress={() => {
        setSelectedApplication(item);
        setShowApprovalModal(true);
      }}
    >
      <Text style={styles.companyName}>{item.companyName || 'Unknown Company'}</Text>
      <Text>{item.applicantName || 'Unknown Applicant'}</Text>
      <Text>Applied on: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Event Management"
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
            name="create-outline"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => setShowEditModal(true)}
      />
      {event && (
        <View style={styles.eventDetails}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text>{event.date}</Text>
          <Text>{event.location}</Text>
          <Text>{event.description}</Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>Pending Approvals</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={themeColor.primary} />
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending applications</Text>
          }
        />
      )}

      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Event</Text>
            <TextInput
              placeholder="Event Name"
              value={editedEvent?.name}
              onChangeText={(text) =>
                setEditedEvent((prev) =>
                  prev ? { ...prev, name: text } : null
                )
              }
            />
            <TextInput
              placeholder="Date"
              value={editedEvent?.date}
              onChangeText={(text) =>
                setEditedEvent((prev) =>
                  prev ? { ...prev, date: text } : null
                )
              }
            />
            <TextInput
              placeholder="Location"
              value={editedEvent?.location}
              onChangeText={(text) =>
                setEditedEvent((prev) =>
                  prev ? { ...prev, location: text } : null
                )
              }
            />
            <TextInput
              placeholder="Description"
              value={editedEvent?.description}
              onChangeText={(text) =>
                setEditedEvent((prev) =>
                  prev ? { ...prev, description: text } : null
                )
              }
              multiline
            />
            <Button 
              text={isEditing ? "Saving..." : "Save Changes"}
              onPress={handleEditEvent}
              disabled={isEditing}
            />
            <Button
              text="Cancel"
              status="danger"
              onPress={() => setShowEditModal(false)}
              disabled={isEditing}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Application Details</Text>
            {selectedApplication && (
              <>
                <Text>Company: {selectedApplication.companyName}</Text>
                <Text>Applicant: {selectedApplication.applicantName}</Text>
                <Text>Position: {selectedApplication.position}</Text>
                <TextInput
                  placeholder="Assigned Position"
                  value={assignedPosition}
                  onChangeText={setAssignedPosition}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Reject Reason (if applicable)"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  style={styles.input}
                  multiline
                />
                <View style={styles.buttonContainer}>
                  <Button
                    text={isApproving ? "Approving..." : "Approve"}
                    onPress={handleApprove}
                    style={styles.approveButton}
                    disabled={isApproving || isRejecting}
                  />
                  <Button
                    text={isRejecting ? "Rejecting..." : "Reject"}
                    status="danger"
                    onPress={handleReject}
                    style={styles.rejectButton}
                    disabled={isApproving || isRejecting}
                  />
                </View>
                <Button
                  text="Cancel"
                  status="info"
                  onPress={() => {
                    setShowApprovalModal(false);
                    setSelectedApplication(null);
                    setAssignedPosition("");
                    setRejectReason("");
                  }}
                  disabled={isApproving || isRejecting}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  eventDetails: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  applicationItem: {
    backgroundColor: "dark",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#888",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  approveButton: {
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8,
  },
});
