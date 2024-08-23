import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from "firebase/firestore";

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  coverPhotoUrl?: string;
};

const ITEMS_PER_PAGE = 10;

export default function EventListForRegistration({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventListForRegistration">) {
  const { isDarkmode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [isListEnd, setIsListEnd] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (loadMore = false) => {
    if (isListEnd && loadMore) return;

    setLoading(true);
    try {
      const eventsRef = collection(db, "events");
      let q = query(
        eventsRef,
        orderBy("startDate", "asc"),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      const eventList: Event[] = [];
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const eventData = doc.data() as Event;
        const eventEndDate = new Date(eventData.endDate);
        if (eventEndDate >= now) {
          eventList.push({ id: doc.id, ...eventData });
        }
      });

      if (loadMore) {
        setEvents([...events, ...eventList]);
      } else {
        setEvents(eventList);
      }

      if (querySnapshot.docs.length < ITEMS_PER_PAGE) {
        setIsListEnd(true);
      } else {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching events: ", error);
      Alert.alert("Error", "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate("EventRegistration", { eventId: item.id })}
    >
      {item.coverPhotoUrl && (
        <Image source={{ uri: item.coverPhotoUrl }} style={styles.coverPhoto} />
      )}
      <View style={styles.eventDetails}>
        <Text style={styles.eventName}>{item.name}</Text>
        <Text>Start: {new Date(item.startDate).toLocaleString()}</Text>
        <Text>End: {new Date(item.endDate).toLocaleString()}</Text>
        <Text>Venue: {item.venue}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <Text>Loading more events...</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!loading && !isListEnd) {
      fetchEvents(true);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Available Events"
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
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No upcoming events available</Text>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 20,
  },
  eventItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  eventDetails: {
    padding: 15,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  footer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});