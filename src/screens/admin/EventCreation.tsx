import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Modal, TouchableOpacity, KeyboardAvoidingView, Image } from 'react-native';
import { Layout, TopNav, Text, TextInput, Button, useTheme, Section } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getAuth } from 'firebase/auth';

export default function EventCreation({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventCreation">) {
  const { isDarkmode } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [ticketTypes, setTicketTypes] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const db = getFirestore();
  const storage = getStorage();
  const auth = getAuth();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setCoverPhoto(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `event_covers/${filename}`);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleCreateEvent = async () => {
    if (!name || !description || !location || !venue || !category || !organizer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      let coverPhotoUrl = null;
      if (coverPhoto) {
        coverPhotoUrl = await uploadImage(coverPhoto);
      }

      const docRef = await addDoc(collection(db, 'events'), {
        name,
        description,
        location,
        venue,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        category,
        tags: tags.split(',').map(tag => tag.trim()),
        ticketTypes: ticketTypes.split(',').map(type => type.trim()),
        organizer,
        coverPhotoUrl,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
        createdBy :  auth.currentUser?.uid,
      });

      Alert.alert('Success', 'Event created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeStartDate = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setStartDate(currentDate);
  };

  const onChangeEndDate = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setEndDate(currentDate);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Layout>
        <TopNav
          middleContent="Create Event"
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? "white" : "black"}
            />
          }
          leftAction={() => navigation.goBack()}
        />
        <ScrollView style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.label}>Cover Photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.coverPhotoContainer}>
              {coverPhoto ? (
                <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
              ) : (
                <Text>Tap to select a cover photo</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Event Name</Text>
            <TextInput
              placeholder="Enter event name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            
            <Text style={styles.label}>Event Description</Text>
            <TextInput
              placeholder="Describe your event"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            
            <Text style={styles.label}>Location</Text>
            <TextInput
              placeholder="Enter event location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            
            <Text style={styles.label}>Venue</Text>
            <TextInput
              placeholder="Specify the venue"
              value={venue}
              onChangeText={setVenue}
              style={styles.input}
            />
            
            <Text style={styles.label}>Start Date and Time</Text>
            <Button
              text={startDate.toLocaleString()}
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateButton}
            />
            
            <Text style={styles.label}>End Date and Time</Text>
            <Button
              text={endDate.toLocaleString()}
              onPress={() => setShowEndDatePicker(true)}
              style={styles.dateButton}
            />
            
            <Text style={styles.label}>Category</Text>
            <TextInput
              placeholder="Enter event category"
              value={category}
              onChangeText={setCategory}
              style={styles.input}
            />
            
            <Text style={styles.label}>Tags (comma-separated)</Text>
            <TextInput
              placeholder="Enter tags"
              value={tags}
              onChangeText={setTags}
              style={styles.input}
            />
            
            <Text style={styles.label}>Ticket Types (comma-separated)</Text>
            <TextInput
              placeholder="Enter ticket types"
              value={ticketTypes}
              onChangeText={setTicketTypes}
              style={styles.input}
            />
            
            <Text style={styles.label}>Organizer</Text>
            <TextInput
              placeholder="Enter organizer name"
              value={organizer}
              onChangeText={setOrganizer}
              style={styles.input}
            />
            
            <Button
              text={isLoading ? "Creating Event..." : "Create Event"}
              onPress={handleCreateEvent}
              style={styles.createButton}
              disabled={isLoading}
            />
          </Section>
        </ScrollView>

        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={onChangeStartDate}
              />
              <Button
                text="Confirm"
                onPress={() => setShowStartDatePicker(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="spinner"
                onChange={onChangeEndDate}
              />
              <Button
                text="Confirm"
                onPress={() => setShowEndDatePicker(false)}
                style={styles.modalButton}
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
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    marginBottom: 20,
  },
  dateButton: {
    marginBottom: 20,
  },
  createButton: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#888',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalButton: {
    marginTop: 20,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});