import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
};

export default function AdminEventList({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "AdminEventList">) {
  const { isDarkmode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (auth.currentUser) {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("createdBy", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const eventList: Event[] = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(eventList);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate("AdminEventPanel", { eventId: item.id })}
    >
      <Text style={styles.eventName}>{item.name}</Text>
      <Text>{item.date}</Text>
      <Text>{item.location}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Manage Events"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events found</Text>
        }
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  eventItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
});