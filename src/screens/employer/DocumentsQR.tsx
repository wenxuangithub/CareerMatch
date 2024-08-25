import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import QRCode from 'react-native-qrcode-svg';
import { useQRCodeEncryption } from "../../hooks/useQRCodeEncryption";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ViewShot from "react-native-view-shot";

export default function DocumentsQR({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "DocumentsQR">) {
  const { isDarkmode } = useTheme();
  const { eventId, companyId, companyName } = route.params;
  const [qrValue, setQrValue] = useState<string>("");
  const { encryptData } = useQRCodeEncryption();
  const qrCodeRef = useRef<ViewShot>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        task: "viewCompanyInfo",
        data: { eventId, companyId },
      });
      const encryptedData = await encryptData(qrData);
      setQrValue(encryptedData);
    } catch (error) {
      console.error("Error generating QR code:", error);
      Alert.alert("Error", "Failed to generate QR code. Please try again.");
    }
  };

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
      if (!qrValue) {
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
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h1 style="margin: 0;">${companyName} Information QR Code</h1>
            <div style="height: 120px;"></div> <!-- Spacer between h1 and img -->
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
        middleContent="QR Codes"
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
        <View style={styles.qrContainer}>
          <Text style={styles.title}>Company Information QR Code</Text>
          {qrValue ? (
            <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 0.9 }}>
              <QRCode
                value={qrValue}
                size={200}
              />
            </ViewShot>
          ) : (
            <Text>Generating QR Code...</Text>
          )}
        </View>
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
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    width: '45%',
  },
});