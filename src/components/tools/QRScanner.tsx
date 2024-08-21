import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "QRScanner">) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { decryptData } = useQRCodeEncryption();
  const { isDarkmode } = useTheme();

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      return () => {
        setIsCameraActive(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setIsCameraActive(false);

    try {
      const decryptedData = await decryptData(data);
      const { task, data: taskData } = JSON.parse(decryptedData);

      switch (task) {
        case "viewDigitalCard":
          navigation.navigate("DigitalCard", { userId: taskData });
          break;
        default:
          Alert.alert("Invalid QR Code", "This QR code is not recognized.");
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      Alert.alert("Error", "Failed to process the QR code. Please try again.");
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
        {isCameraActive ? (
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
