import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Layout, TopNav, Text, useTheme } from 'react-native-rapi-ui';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "SavedCards">) {
  const { isDarkmode } = useTheme();
  const [savedCards, setSavedCards] = useState<Array<{ userId: string; name: string }>>([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, 'user', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setSavedCards(userData.savedCards || []);
      }
    }
  };

  const renderCard = ({ item }: { item: { userId: string; name: string } }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DigitalCard', { userId: item.userId })}
    >
      <Text style={styles.cardName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={isDarkmode ? "white" : "black"} />
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Saved Cards"
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
        data={savedCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
    list: {
        padding: 20,
      },
      card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginBottom: 10,
      },
      cardName: {
        fontSize: 18,
      },
});