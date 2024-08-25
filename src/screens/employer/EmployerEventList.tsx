import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type AcceptedEvent = {
  id: string;
  eventId: string;
  eventName: string;
  companyName: string;
  date: string;
  companyId: string;
};

export default function EmployerEventList({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EmployerEventList">) {
  const { isDarkmode } = useTheme();
  const [acceptedEvents, setAcceptedEvents] = useState<AcceptedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchAcceptedEvents();
  }, []);

  const fetchAcceptedEvents = async () => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const registrationsRef = collection(db, "eventRegistrations");
      const q = query(
        registrationsRef,
        where("userId", "==", auth.currentUser.uid),
        where("status", "==", "approved")
      );
      const querySnapshot = await getDocs(q);

      const events: AcceptedEvent[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const eventDoc = await getDoc(doc(db, "events", data.eventId));
        const companyDoc = await getDoc(doc(db, "companies", data.companyId));

        if (eventDoc.exists() && companyDoc.exists()) {
          events.push({
            id: docSnapshot.id,
            eventId: data.eventId,
            eventName: eventDoc.data().name,
            companyName: companyDoc.data().name,
            companyId : data.companyId,
            date: eventDoc.data().date,
          });
        }
      }

      setAcceptedEvents(events);
    } catch (error) {
      console.error("Error fetching accepted events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventItem = ({ item }: { item: AcceptedEvent }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate("EmployerEventPanel", { eventId: item.eventId, companyId : item.companyId, companyName: item.companyName })}
    >
      <Text style={styles.eventName}>{item.eventName}</Text>
      <Text>{item.companyName}</Text>
      <Text>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Your Events"
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
        <FlatList
          data={acceptedEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No accepted events found</Text>
          }
        />
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  eventItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  
});