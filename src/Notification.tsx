import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";

type Notification = {
  id: string;
  content: string;
  byWho: string;
  timestamp: number;
};

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "Notification">) {
  const { isDarkmode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (auth.currentUser) {
      const notificationRef = doc(db, "Notifications", auth.currentUser.uid);
      const notificationSnap = await getDoc(notificationRef);
      if (notificationSnap.exists()) {
        const data = notificationSnap.data();
        setNotifications(data.notifications || []);
      }
    }
  };

  const deleteNotification = async (notification: Notification) => {
    if (auth.currentUser) {
      const notificationRef = doc(db, "Notifications", auth.currentUser.uid);
      await updateDoc(notificationRef, {
        notifications: arrayRemove(notification)
      });
      setNotifications(notifications.filter(n => n.id !== notification.id));
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => Alert.alert('Notification', item.content)}
      onLongPress={() => {
        Alert.alert(
          'Delete Notification',
          'Are you sure you want to delete this notification?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => deleteNotification(item) }
          ]
        );
      }}
    >
      <Text style={styles.notificationText}>{item.content}</Text>
      <Text style={styles.notificationDate}>
        {new Date(item.timestamp).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Notifications"
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
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications</Text>
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
  notificationItem: {
    backgroundColor: '#888',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  notificationText: {
    fontSize: 16,
  },
  notificationDate: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
});