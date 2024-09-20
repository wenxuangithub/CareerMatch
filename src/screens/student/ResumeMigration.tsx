import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Layout,
  Text,
  TopNav,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useGeminiAI } from "../../hooks/useGeminiAI";
import axios from "axios";

const API_BASE_URL = "http://10.10.5.32:5000"; // Make sure this matches your Flask server address

export default function ResumeMigration({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "ResumeMigration">) {
  const { isDarkmode } = useTheme();
  const [preUploadedResumeUrl, setPreUploadedResumeUrl] = useState<
    string | null
  >(null);
  const [selectedResume, setSelectedResume] =
    useState<DocumentPicker.DocumentResult | null>(null);
  const [latexContent, setLatexContent] = useState<string | null>(null);
  const { loading, error, convertToLatex } = useGeminiAI();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUserResumeUrl();
  }, []);

  const fetchUserResumeUrl = async () => {
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, "user", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPreUploadedResumeUrl(userData.pdfURL || null);
      }
    }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedResume(result);
      }
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleConvertToLatex = async () => {
    if (!preUploadedResumeUrl && !selectedResume) {
      Alert.alert(
        "Error",
        "Please upload a resume or use your pre-uploaded resume"
      );
      return;
    }

    try {
      const resumeUrl =
        selectedResume?.assets?.[0]?.uri || preUploadedResumeUrl;
      if (!resumeUrl) {
        throw new Error("No resume URL available");
      }

      const result = await convertToLatex(resumeUrl);
      if (result) {
        setLatexContent(result);
      } else {
        Alert.alert("Error", "Failed to convert resume to LaTeX");
      }
    } catch (err) {
      console.error("Error converting to LaTeX:", err);
      Alert.alert("Error", "Failed to convert resume to LaTeX");
    }
  };

  const handleExportToPdf = async () => {
    if (!latexContent) {
      Alert.alert("Error", "Please convert the resume to LaTeX first");
      return;
    }

    setIsExporting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/export_to_pdf`,
        { latex: latexContent },
        { responseType: "arraybuffer" }
      );

      const pdfContent = response.data;
      const pdfPath = `${FileSystem.documentDirectory}resume.pdf`;

      // Convert ArrayBuffer to Base64
      const uint8Array = new Uint8Array(pdfContent);
      let binaryString = uint8Array.reduce(
        (str, byte) => str + String.fromCharCode(byte),
        ""
      );
      let base64String = btoa(binaryString);

      await FileSystem.writeAsStringAsync(pdfPath, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === "android") {
        const androidPath = `${FileSystem.cacheDirectory}resume.pdf`;
        await FileSystem.copyAsync({ from: pdfPath, to: androidPath });
        await Sharing.shareAsync(androidPath, {
          UTI: "public.pdf",
          mimeType: "application/pdf",
        });
      } else {
        await Sharing.shareAsync(pdfPath, {
          UTI: "public.pdf",
          mimeType: "application/pdf",
        });
      }

      Alert.alert("Success", "PDF has been generated and saved.");
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      Alert.alert("Error", "Failed to export resume to PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Resume Migration"
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
        {preUploadedResumeUrl && (
          <TouchableOpacity
            style={styles.preUploadedResumeButton}
            onPress={() => setSelectedResume(null)}
          >
            <Text>Use Pre-uploaded Resume</Text>
          </TouchableOpacity>
        )}
        <Button
          text="Upload New Resume"
          onPress={handleUploadResume}
          style={styles.uploadButton}
        />
        {selectedResume && (
          <Text style={styles.selectedResumeText}>
            Selected: {selectedResume.assets?.[0]?.name || "Resume"}
          </Text>
        )}
        <Button
          text={loading ? "Converting..." : "Convert to LaTeX"}
          onPress={handleConvertToLatex}
          style={styles.convertButton}
          disabled={loading}
        />
        {latexContent && (
          <View style={styles.latexContainer}>
            <Text style={styles.latexTitle}>LaTeX Content:</Text>
            <Text style={styles.latexText}>
              {latexContent.substring(0, 200)}...
            </Text>
          </View>
        )}
        <Button
          text={isExporting ? "Exporting..." : "Export to PDF"}
          onPress={handleExportToPdf}
          style={styles.exportButton}
          disabled={isExporting || !latexContent}
        />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  preUploadedResumeButton: {
    padding: 10,
    backgroundColor: themeColor.gray200,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  uploadButton: {
    marginBottom: 10,
  },
  selectedResumeText: {
    marginBottom: 10,
  },
  convertButton: {
    marginBottom: 20,
  },
  latexContainer: {
    backgroundColor: themeColor.gray100,
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  latexTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  latexText: {
    fontSize: 14,
  },
  exportButton: {
    marginBottom: 20,
  },
});
