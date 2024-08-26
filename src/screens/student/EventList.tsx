import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { Text, Layout, TopNav, useTheme, themeColor } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, getDocs } from 'firebase/firestore';

type Event = {
  id: string;
  coverPhotoUrl?: string;
  name: string;
  startDate: string;
  location: string;
};

export default function EventList({ navigation }: NativeStackScreenProps<MainStackParamList, "EventList">) {
  const { isDarkmode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const db = getFirestore();
    const eventsCollection = collection(db, 'events');
    const eventSnapshot = await getDocs(eventsCollection);
    const eventList = eventSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
    setEvents(eventList);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventInfo', { eventId: item.id })}
    >
      {item.coverPhotoUrl && (
        <Image source={{ uri: item.coverPhotoUrl }} style={styles.coverPhoto} />
      )}
      <Text style={styles.eventName}>{item.name}</Text>
      <Text>{item.startDate}</Text>
      <Text>{item.location}</Text>
    </TouchableOpacity>
  );

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <TopNav
        middleContent="Upcoming Events"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyList}>No events found</Text>}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 20,
  },
  eventItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 50,
  },
  coverPhoto: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
});