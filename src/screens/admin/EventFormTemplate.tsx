import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Layout, TopNav, Text, Button, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

type Questionnaire = {
  id: string;
  eventId: string;
  userId: string;
  questionnaire: {
    name: string;
    questions: any[]; // You might want to define a more specific type for questions
  };
  createdAt: string;
  updatedAt: string;
};

export default function EventFormTemplate({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "EventFormTemplate">) {
  const { isDarkmode } = useTheme();
  const { eventId } = route.params;
  const [templates, setTemplates] = useState<Questionnaire[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const questionnaireRef = collection(db, "questionnaires");
      const q = query(questionnaireRef, where("eventId", "==", eventId));
      const querySnapshot = await getDocs(q);
      const templateList: Questionnaire[] = [];
      querySnapshot.forEach((doc) => {
        templateList.push({ id: doc.id, ...doc.data() } as Questionnaire);
      });
      setTemplates(templateList);
    } catch (error) {
      console.error("Error fetching templates:", error);
      Alert.alert("Error", "Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async () => {
    if (!selectedTemplateId) {
      Alert.alert("Error", "Please select a template first");
      return;
    }

    setIsLoading(true);
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        questionnaireId: selectedTemplateId
      });
      Alert.alert("Success", "Questionnaire selected successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error selecting template:", error);
      Alert.alert("Error", "Failed to select template");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTemplateItem = ({ item }: { item: Questionnaire }) => (
    <TouchableOpacity
      style={[
        styles.templateItem,
        selectedTemplateId === item.id && styles.selectedTemplateItem
      ]}
      onPress={() => {
        setSelectedTemplateId(item.id);
        navigation.navigate("FormContentView", { questionnaire: item.questionnaire });
      }}
    >
      <Text style={styles.templateName}>{item.questionnaire.name}</Text>
      <Text style={styles.templateDate}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.templateQuestions}>
        Questions: {item.questionnaire.questions.length}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Select Questionnaire Template"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
        rightContent={
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={isDarkmode ? themeColor.white100 : themeColor.dark}
            />
          }
          rightAction={handleSelectTemplate}
        />
      <View style={styles.container}>
        <FlatList
          data={templates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No templates available</Text>
          }
        />
      </View>
    </Layout>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    flexGrow: 1,
  },
  templateItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  selectedTemplateItem: {
    backgroundColor: '#d0e0ff',
    borderColor: '#4080ff',
    borderWidth: 2,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  templateDate: {
    fontSize: 14,
    color: '#666',
  },
  templateQuestions: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});