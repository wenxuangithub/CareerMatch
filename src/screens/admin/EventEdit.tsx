import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Modal, TouchableOpacity, KeyboardAvoidingView, Image } from 'react-native';
import { Layout, TopNav, Text, TextInput, Button, useTheme, Section } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";

export default function EventEdit({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventEdit">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
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

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    setIsLoading(true);
    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        setName(eventData.name);
        setDescription(eventData.description);
        setLocation(eventData.location);
        setVenue(eventData.venue);
        setStartDate(new Date(eventData.startDate));
        setEndDate(new Date(eventData.endDate));
        setCategory(eventData.category);
        setTags(eventData.tags.join(', '));
        setTicketTypes(eventData.ticketTypes.join(', '));
        setOrganizer(eventData.organizer);
        setCoverPhoto(eventData.coverPhotoUrl);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      Alert.alert("Error", "Failed to fetch event details");
    }
    setIsLoading(false);
  };

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

  const handleUpdateEvent = async () => {
    if (!name || !description || !location || !venue || !category || !organizer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      let coverPhotoUrl = coverPhoto;
      if (coverPhoto && !coverPhoto.startsWith('http')) {
        coverPhotoUrl = await uploadImage(coverPhoto);
      }

      await updateDoc(doc(db, 'events', eventId), {
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
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Event updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating document: ', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeStartDate = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const onChangeEndDate = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Layout>
        <TopNav
          middleContent="Edit Event"
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
                <Text>Tap to select a cover photo</Text>)}
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
                  text={isLoading ? "Updating Event..." : "Update Event"}
                  onPress={handleUpdateEvent}
                  style={styles.updateButton}
                  disabled={isLoading}
                />
              </Section>
            </ScrollView>
    
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={onChangeStartDate}
              />
            )}
    
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                onChange={onChangeEndDate}
              />
            )}
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
      updateButton: {
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