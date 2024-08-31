import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
} from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: "active" | "inactive";
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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleEditEvent = () => {
    if (event) {
      navigation.navigate("EventEdit", { eventId: event.id });
    }
  };

  const handleDeactivateEvent = async () => {
    Alert.alert(
      "Confirm Deactivate",
      "Are you sure you want to deactivate this event? It will no longer be visible to users.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Deactivate",
          onPress: async () => {
            setIsLoading(true);
            try {
              await updateDoc(doc(db, "events", eventId), {
                status: "inactive",
              });
              setEvent((prev) =>
                prev ? { ...prev, status: "inactive" } : null
              );
              Alert.alert("Success", "Event deactivated successfully");
            } catch (error) {
              console.error("Error deactivating event:", error);
              Alert.alert("Error", "Failed to deactivate event");
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  const handleReactivateEvent = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "active",
      });
      setEvent((prev) => (prev ? { ...prev, status: "active" } : null));
      Alert.alert("Success", "Event reactivated successfully");
    } catch (error) {
      console.error("Error reactivating event:", error);
      Alert.alert("Error", "Failed to reactivate event");
    }
    setIsLoading(false);
  };

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.applicationItem}
      onPress={() => {
        navigation.navigate("ApplicationDetails", { applicationId: item.id });
      }}
    >
      <Text style={styles.companyName}>
        {item.companyName || "Unknown Company"}
      </Text>
      <Text>{item.applicantName || "Unknown Applicant"}</Text>
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
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={themeColor.primary} />
      ) : (
        <>
          {event && (
            <View style={styles.eventDetails}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text>{event.date}</Text>
              <Text>{event.location}</Text>
              <Text>{event.description}</Text>
              <Text style={styles.statusText}>Status: {event.status}</Text>
              <View style={styles.buttonContainer}>
                {event.status === 'active' ? (
                  <>
                    <Button
                      text="Edit Event"
                      onPress={handleEditEvent}
                      style={styles.button}
                    />
                    <Button
                      text="Deactivate Event"
                      status="danger"
                      onPress={handleDeactivateEvent}
                      style={styles.button}
                    />
                    <Button
                      text="Attendance"
                      onPress={() => navigation.navigate("AttendanceFeature", { eventId: event.id })}
                      style={styles.button}
                    />
                  </>
                ) : (
                  <Button
                    text="Reactivate Event"
                    status="primary"
                    onPress={handleReactivateEvent}
                    style={styles.button}
                  />
                )}
              </View>
            </View>
          )}
          {event && event.status === 'active' && (
            <>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              <FlatList
                data={applications}
                renderItem={renderApplicationItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No pending applications</Text>
                }
              />
            </>
          )}
        </>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  eventDetails: {
    padding: 16,
    backgroundColor: "#888",
    marginBottom: 16,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 10, // Add space between buttons
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

  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deactivateButton: {
    flex: 1,
    marginLeft: 8,
  },
  reactivateButton: {
    flex: 1,
  },

});
