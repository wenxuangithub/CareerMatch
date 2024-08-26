import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  Layout,
  TopNav,
  Text,
  TextInput,
  Button,
  useTheme,
  Section,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Company = {
  id: string;
  name: string;
  registrationNumber: string;
  officeTelephone: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  coverPhotoUrl?: string;
};

type ListItem =
  | { type: "event"; data: Event }
  | {
      type: "input";
      id: string;
      label: string;
      value: string;
      onChangeText: (text: string) => void;
    }
  | {
      type: "button";
      id: string;
      label: string;
      onPress: () => void;
      disabled?: boolean;
    }
  | { type: "companyList"; data: Company[] }
  | { type: "selectedCompany"; company: Company };

export default function EventRegistration({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventRegistration">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState<Omit<Company, "id">>({
    name: "",
    registrationNumber: "",
    officeTelephone: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);

  const db = getFirestore();
  const auth = getAuth();

  const [keyboardStatus, setKeyboardStatus] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchEvent();
  }, []);

  useEffect(() => {
    if (companySearch.length > 2) {
      searchCompanies();
    } else {
      setCompanies([]);
    }
  }, [companySearch]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
      } else {
        Alert.alert("Error", "Event not found");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching event: ", error);
      Alert.alert("Error", "Failed to fetch event details");
    } finally {
      setLoading(false);
    }
  };

  const searchCompanies = async () => {
    setIsSearchingCompany(true);
    try {
      const companiesRef = collection(db, "companies");
      const q = query(
        companiesRef,
        where("name", ">=", companySearch.toLowerCase()),
        where("name", "<=", companySearch.toLowerCase() + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const companyList: Company[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Company)
      );
      setCompanies(companyList);
    } catch (error) {
      console.error("Error searching companies: ", error);
      Alert.alert("Error", "Failed to search companies");
    } finally {
      setIsSearchingCompany(false);
    }
  };

  const handleCreateCompany = async () => {
    if (
      !newCompany.name ||
      !newCompany.registrationNumber ||
      !newCompany.officeTelephone
    ) {
      Alert.alert("Error", "Please fill in all company details");
      return;
    }

    setIsCreatingCompany(true);
    try {
      const companiesRef = collection(db, "companies");
      const docRef = await addDoc(companiesRef, {
        ...newCompany,
        name: newCompany.name.toLowerCase(),
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
      });
      const createdCompany = { id: docRef.id, ...newCompany };
      setSelectedCompany(createdCompany);
      setShowNewCompanyModal(false);
    } catch (error) {
      console.error("Error creating company: ", error);
      Alert.alert("Error", "Failed to create company");
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedCompany) {
      Alert.alert("Error", "Please select or create a company");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to register");
      return;
    }

    setIsRegistering(true);
    try {
      await addDoc(collection(db, "eventRegistrations"), {
        eventId,
        companyId: selectedCompany.id,
        userId: auth.currentUser.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Registration submitted successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error registering: ", error);
      Alert.alert("Error", "Failed to register for event");
    } finally {
      setIsRegistering(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "event":
        return (
          <View style={styles.eventContainer}>
            {item.data.coverPhotoUrl && (
              <Image
                source={{ uri: item.data.coverPhotoUrl }}
                style={styles.coverPhoto}
              />
            )}
            <Text style={styles.eventName}>{item.data.name}</Text>
            <Text style={styles.eventDescription}>{item.data.description}</Text>
            <Text style={styles.eventDetail}>
              Location: {item.data.location}
            </Text>
            <Text style={styles.eventDetail}>Venue: {item.data.venue}</Text>
            <Text style={styles.eventDetail}>
              Start: {new Date(item.data.startDate).toLocaleString()}
            </Text>
            <Text style={styles.eventDetail}>
              End: {new Date(item.data.endDate).toLocaleString()}
            </Text>
          </View>
        );
      case "input":
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput
              value={item.value}
              onChangeText={item.onChangeText}
              style={styles.input}
            />
          </View>
        );
      case "button":
        return (
          <Button
            text={item.label}
            onPress={item.onPress}
            style={styles.button}
            disabled={item.disabled}
          />
        );
      case "companyList":
        return (
          <FlatList
            data={item.data}
            keyExtractor={(company) => company.id}
            renderItem={({ item: company }) => (
              <TouchableOpacity
                style={styles.companyItem}
                onPress={() => setSelectedCompany(company)}
              >
                <Text>{company.name}</Text>
                <Text style={styles.companyDetail}>
                  {company.registrationNumber}
                </Text>
              </TouchableOpacity>
            )}
          />
        );
      case "selectedCompany":
        return (
          <View style={styles.selectedCompany}>
            <Text style={styles.selectedCompanyText}>Selected Company:</Text>
            <Text>{item.company.name}</Text>
            <Text>{item.company.registrationNumber}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const listData: ListItem[] = [
    ...(event ? [{ type: "event", data: event }] : []),
    {
      type: "input",
      id: "companySearch",
      label: "Search Company",
      value: companySearch,
      onChangeText: setCompanySearch,
    },
    ...(companies.length > 0 ? [{ type: "companyList", data: companies }] : []),
    ...(companySearch.length > 2 && companies.length === 0
      ? [
          {
            type: "button",
            id: "createCompany",
            label: "Create New Company",
            onPress: () => setShowNewCompanyModal(true),
          },
        ]
      : []),
    ...(selectedCompany
      ? [{ type: "selectedCompany", company: selectedCompany }]
      : []),
    {
      type: "button",
      id: "register",
      label: isRegistering ? "Registering..." : "Register for Event",
      onPress: handleRegister,
      disabled: isRegistering || !selectedCompany,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <TopNav
          middleContent="Event Registration"
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? "white" : "black"}
            />
          }
          leftAction={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkmode ? "white" : "black"}
          />
        </View>
      </Layout>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Layout>
        <TopNav
          middleContent="Event Registration"
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? "white" : "black"}
            />
          }
          leftAction={() => navigation.goBack()}
        />
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: keyboardStatus ? 120 : 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        />

        <Modal
          visible={showNewCompanyModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Company</Text>
              <TextInput
                placeholder="Company Name"
                value={newCompany.name}
                onChangeText={(text) =>
                  setNewCompany({ ...newCompany, name: text })
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Registration Number"
                value={newCompany.registrationNumber}
                onChangeText={(text) =>
                  setNewCompany({ ...newCompany, registrationNumber: text })
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Office Telephone"
                value={newCompany.officeTelephone}
                onChangeText={(text) =>
                  setNewCompany({ ...newCompany, officeTelephone: text })
                }
                style={styles.input}
                keyboardType="phone-pad"
              />
              <Button
                text={isCreatingCompany ? "Creating..." : "Create Company"}
                onPress={handleCreateCompany}
                style={styles.button}
                disabled={isCreatingCompany}
              />
              <Button
                text="Cancel"
                status="danger"
                onPress={() => setShowNewCompanyModal(false)}
                style={styles.button}
              />
            </View>
          </View>
        </Modal>
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  eventContainer: {
    marginBottom: 20,
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 10,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  eventDetail: {
    fontSize: 14,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  companyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  companyDetail: {
    fontSize: 12,
    color: "#666",
  },
  selectedCompany: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#888",
    borderRadius: 5,
  },
  selectedCompanyText: {
    fontWeight: "bold",
    marginBottom: 5,
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
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
});