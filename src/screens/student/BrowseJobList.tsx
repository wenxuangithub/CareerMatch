import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Layout, TopNav, useTheme, themeColor } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

type Job = {
  companyName: string;
  role: string;
  tags: string[];
  classification: string;
  descriptions: string;
  location: string;
  time: string;
};

type EventDetails = {
  id: string;
  name: string;
  jobs: Job[];
};

export default function BrowseJobList({ route, navigation }: NativeStackScreenProps<MainStackParamList, "BrowseJobList">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    setLoading(true);
    const db = getFirestore();
    const eventDoc = doc(db, 'events', eventId);
    const eventSnapshot = await getDoc(eventDoc);
    if (eventSnapshot.exists()) {
      const data = eventSnapshot.data() as EventDetails;
      setEventDetails({
        id: eventSnapshot.id,
        name: data.name,
        jobs: data.jobs || [],
      });
    }
    setLoading(false);
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <View style={styles.jobItem}>
      <Text style={styles.companyName}>{item.companyName}</Text>
      <Text style={styles.jobRole}>{item.role}</Text>
      <View style={styles.tagsContainer}>
        {item.tags.map((tag, index) => (
          <Text key={index} style={styles.tag}>{tag}</Text>
        ))}
      </View>
    </View>
  );

  const handleAIRecommendation = () => {
    if (eventDetails) {
      navigation.navigate("AIJobRecommendation", { jobs: eventDetails.jobs });
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Browse Jobs"
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
            name="bulb-outline"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={handleAIRecommendation}
      />
      <View style={styles.container}>
        {loading ? (
          <Text>Loading jobs...</Text>
        ) : (
          <>
            <Text style={styles.eventName}>{eventDetails?.name}</Text>
            <Text style={styles.jobCount}>{eventDetails?.jobs.length} jobs available</Text>
            <FlatList
              data={eventDetails?.jobs}
              renderItem={renderJobItem}
              keyExtractor={(item, index) => `${item.companyName}-${item.role}-${index}`}
              ListEmptyComponent={<Text>No jobs available for this event.</Text>}
            />
          </>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobCount: {
    fontSize: 16,
    marginBottom: 20,
  },
  jobItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 15,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  jobRole: {
    fontSize: 16,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: themeColor.primary,
    color: 'white',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 12,
  },
});