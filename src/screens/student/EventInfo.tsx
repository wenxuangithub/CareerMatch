import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Layout, TopNav, useTheme, themeColor, Button } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

type Job = {
  companyName: string;
  role: string;
  tags: string[];
};

type EventDetails = {
  id: string;
  name: string;
  startDate: string;
  location: string;
  description: string;
  coverPhotoUrl?: string;
  organizer: string;
  endDate: string;
  jobs: Job[];
  venue: string;
};

export default function EventInfo({ route, navigation }: NativeStackScreenProps<MainStackParamList, "EventInfo">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    const db = getFirestore();
    const eventDoc = doc(db, 'events', eventId);
    const eventSnapshot = await getDoc(eventDoc);
    if (eventSnapshot.exists()) {
      setEventDetails({ id: eventSnapshot.id, ...eventSnapshot.data() } as EventDetails);
    }
  };

  const handleApplyToAttend = () => {
    // Implement the logic for applying to attend the event
    console.log("Applied to attend the event");
    // You might want to navigate to a confirmation page or show a modal
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  if (!eventDetails) {
    return (
      <Layout>
        <TopNav
        middleContent="Event Details"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      </Layout>
    );
  }

  return (
    <Layout>
      <TopNav
        middleContent="Event Details"
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
        <Image source={{ uri: eventDetails.coverPhotoUrl }} style={styles.eventImage} />
        <View style={styles.contentContainer}>
          <Text style={styles.eventName}>{eventDetails.name}</Text>
          <Text style={styles.organizer}>by {eventDetails.organizer}</Text>

          <View style={styles.infoSection}>
            <Ionicons name="calendar-outline" size={24} color={themeColor.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Start</Text>
              <Text>{formatDate(eventDetails.startDate)}</Text>
              <Text style={[styles.infoTitle, { marginTop: 10 }]}>End</Text>
              <Text>{formatDate(eventDetails.endDate)}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="location-outline" size={24} color={themeColor.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Location</Text>
              <Text>{eventDetails.location}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="business-outline" size={24} color={themeColor.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Venue</Text>
              <Text>{eventDetails.venue}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{eventDetails.description}</Text>

          <Text style={styles.sectionTitle}>Job Opportunities</Text>
          <Text>{eventDetails.jobs.length} jobs available</Text>

          <Button
            text="Browse Job List"
            onPress={() => navigation.navigate('BrowseJobList', { eventId: eventDetails.id })}
            style={styles.browseJobsButton}
          />
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    padding: 20,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  organizer: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    marginBottom: 20,
  },
  browseJobsButton: {
    marginTop: 15,
  },
  applyButton: {
    marginTop: 15,
  },
});