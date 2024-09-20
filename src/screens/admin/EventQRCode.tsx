// EventQRCode.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import QRCode from 'react-native-qrcode-svg';
import { useQRCodeEncryption } from "../../hooks/useQRCodeEncryption";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function EventQRCode({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventQRCode">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [qrData, setQrData] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const { encryptData } = useQRCodeEncryption();
  const db = getFirestore();
  const qrCodeRef = useRef<ViewShot>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateQRData = async () => {
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setEventName(eventData.name); // Store event name for use in PDF
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
        Alert.alert("Error", "Failed to generate QR code. Please try again.");
      }
    };

    generateQRData();
  }, [eventId]);

  const captureQRCode = async (): Promise<string> => {
    if (qrCodeRef.current) {
      try {
        const uri = await qrCodeRef.current.capture();
        return uri;
      } catch (error) {
        console.error("Error capturing QR code:", error);
        throw new Error("Failed to capture QR code");
      }
    } else {
      throw new Error("QR Code reference is not available");
    }
  };

  const exportQRCode = async (format: 'pdf' | 'png') => {
    setIsLoading(true);
    try {
      if (!qrData) {
        Alert.alert("Error", "QR code not generated yet.");
        return;
      }

      const qrCodeUri = await captureQRCode();

      let fileUri: string;
      if (format === 'png') {
        fileUri = qrCodeUri;
      } else {
        // Generate PDF using expo-print
        const htmlContent = `
        <html>
          <body>
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
              <h1 style="margin-bottom: 30px;">${eventName} Attendance QR Code</h1>
              <img src="${qrCodeUri}" style="width: 300px; height: 300px;" />
            </div>
          </body>
        </html>
        `;
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false
        });
        fileUri = uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error exporting QR code:", error);
      Alert.alert("Error", "Failed to export QR code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{eventName} Attendance QR Code</Text>
        {qrData ? (
          <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 0.9 }}>
            <QRCode
              value={qrData}
              size={250}
              color="black"
              backgroundColor="white"
            />
          </ViewShot>
        ) : (
          <Text>Generating QR Code...</Text>
        )}
        <View style={styles.buttonContainer}>
          <Button
            text={isLoading ? "Exporting..." : "Export as PNG"}
            onPress={() => exportQRCode('png')}
            style={styles.button}
            disabled={isLoading}
          />
          <Button
            text={isLoading ? "Exporting..." : "Export as PDF"}
            onPress={() => exportQRCode('pdf')}
            style={styles.button}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  button: {
    width: '45%',
  },
});