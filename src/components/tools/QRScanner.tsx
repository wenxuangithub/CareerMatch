import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useQRCodeEncryption } from "../../hooks/useQRCodeEncryption";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import {
  Layout,
  TopNav,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function QRScanner({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "QRScanner">) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { decryptData } = useQRCodeEncryption();
  const { isDarkmode } = useTheme();
  const isFocused = useIsFocused();
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    if (isFocused && permission?.granted) {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [isFocused, permission]);

  const recordScan = async (scanData: any) => {
    try {
      const qrDataRef = collection(db, "QRData");
      await addDoc(qrDataRef, {
        ...scanData,
        userId: auth.currentUser?.uid || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording scan:", error);
    }
  };

  const checkAttendanceRecord = async (eventId: string, userId: string) => {
    const qrDataRef = collection(db, "QRData");
    const q = query(qrDataRef, 
      where("eventId", "==", eventId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setIsCameraActive(false);

    try {
      const decryptedData = await decryptData(data);
      const { task, data: taskData } = JSON.parse(decryptedData);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      switch (task) {
        case "attendance":
          const hasAttended = await checkAttendanceRecord(taskData.eventId, userId);
          
          if (hasAttended) {
            navigation.navigate("QRRecorded", { 
              message: "You have already recorded your attendance for this event.",
              success: false
            });
          } else if (taskData.questionnaireId) {
            navigation.navigate("EventForm", { 
              eventId: taskData.eventId, 
              questionnaireId: taskData.questionnaireId 
            });
          } else {

            const qrDataRef = collection(db, "QRData");
            await addDoc(qrDataRef, {
              eventId: taskData.eventId,
              userId,
              task: "attendance",
              timestamp: new Date().toISOString(),
            });

            navigation.navigate("QRRecorded", { 
              message: "Attendance recorded successfully!",
              success: true
            });
          }
          break;

        case "viewDigitalCard":
          await recordScan({
            task,
            targetUserId: taskData,
            scanType: 'view_digital_card',
          });
          navigation.navigate("DigitalCard", { userId: taskData });
          break;

        case "viewCompanyInfo":
          await recordScan({
            task,
            eventId: taskData.eventId,
            companyId: taskData.companyId,
            scanType: 'view_company_info',
          });
          navigation.navigate("EventCompanyInfo", { 
            eventId: taskData.eventId, 
            companyId: taskData.companyId 
          });
          break;

        default:
          await recordScan({
            task,
            scanType: 'unknown',
            result: 'invalid_qr_code',
          });
          Alert.alert("Invalid QR Code", "This QR code is not recognized.");
          if (isFocused) setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      await recordScan({
        scanType: 'error',
        errorMessage: error,
      });
      Alert.alert("Error", "Failed to process the QR code. Please try again.");
      if (isFocused) setIsCameraActive(true);
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          We need your permission to use the camera
        </Text>
        <Button text="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <Layout>
      <TopNav
        middleContent="Scan QR Code"
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
        {isCameraActive && isFocused ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.bottomTextContainer}>
              <Text style={styles.scanText}>Scan a QR Code</Text>
            </View>
          </>
        ) : (
          <View style={styles.inactiveContainer}>
            <Text style={styles.inactiveText}>Camera is off</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsCameraActive(true)}
            >
              <Text style={styles.buttonText}>Activate Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomTextContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 10,
  },
  scanText: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  inactiveText: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
