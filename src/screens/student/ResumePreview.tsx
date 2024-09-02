import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
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
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ResumePreview({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "ResumePreview">) {
  const { isDarkmode } = useTheme();
  const { resume } = route.params;

  const handleSaveResume = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}resume.md`;
      await FileSystem.writeAsStringAsync(fileUri, resume);
      
      if (Platform.OS === 'android') {
        const UTI = 'public.markdown';
        await Sharing.shareAsync(fileUri, { UTI });
      } else {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume. Please try again.');
    }
  };

  const handleShareResume = async () => {
    try {
      await Share.share({
        message: resume,
        title: 'My Generated Resume',
      });
    } catch (error) {
      console.error('Error sharing resume:', error);
      alert('Failed to share resume. Please try again.');
    }
  };

  return (
    <Layout>
      <TopNav
        middleContent="Resume Preview"
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
        <Markdown style={markdownStyles(isDarkmode)}>
          {resume}
        </Markdown>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          text="Save Resume"
          onPress={handleSaveResume}
          style={styles.button}
        />
        <Button
          text="Share Resume"
          onPress={handleShareResume}
          style={styles.button}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

const markdownStyles = (isDarkmode: boolean) => ({
  body: {
    color: isDarkmode ? themeColor.white : themeColor.dark,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: isDarkmode ? themeColor.white : themeColor.dark,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: isDarkmode ? themeColor.white : themeColor.dark,
  },
  paragraph: {
    marginBottom: 10,
    color: isDarkmode ? themeColor.white : themeColor.dark,
  },
  listItem: {
    marginBottom: 5,
    color: isDarkmode ? themeColor.white : themeColor.dark,
  },
});