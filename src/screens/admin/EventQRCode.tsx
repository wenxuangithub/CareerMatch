// EventQRCode.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import QRCode from 'react-native-qrcode-svg';
import { useQRCodeEncryption } from "../../hooks/useQRCodeEncryption";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function EventQRCode({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventQRCode">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [qrData, setQrData] = useState<string>('');
  const { encryptData } = useQRCodeEncryption();
  const db = getFirestore();

  useEffect(() => {
    const generateQRData = async () => {
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          const qrContent = JSON.stringify({
            task: 'attendance',
            data: {
              eventId: eventId,
              questionnaireId: eventData.questionnaireId || null
            }
          });
          const encryptedData = await encryptData(qrContent);
          setQrData(encryptedData);
        }
      } catch (error) {
        console.error("Error generating QR data:", error);
      }
    };

    generateQRData();
  }, [eventId]);

  return (
    <Layout>
      <TopNav
        middleContent="Event QR Code"
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
        {qrData ? (
          <QRCode
            value={qrData}
            size={250}
            color="black"
            backgroundColor="white"
          />
        ) : (
          <Text>Generating QR Code...</Text>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});