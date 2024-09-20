import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button, TextInput } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";
import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

type ConversationPageProps = NativeStackScreenProps<MainStackParamList, "ConversationPage">;

interface Message {
  sender: string;
  content: string;
  timestamp: number;
}

interface ApplicationInfo {
  companyName: string;
  role: string;
  interviewDate?: string;
  interviewMessage?: string;
}

export default function ConversationPage({ route, navigation }: ConversationPageProps) {
    const { isDarkmode } = useTheme();
    const { applicationId } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [applicationInfo, setApplicationInfo] = useState<ApplicationInfo | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
  
    const auth = getAuth();
    const db = getFirestore();

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const fetchApplicationData = async () => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const docRef = doc(db, "JobApplication", applicationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.conversations || []);
        setApplicationInfo({
          companyName: data.companyName,
          role: data.role,
          interviewDate: data.interviewDate,
          interviewMessage: data.interviewMessage,
        });
      }
    } catch (error) {
      console.error("Error fetching application data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!auth.currentUser || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const docRef = doc(db, "JobApplication", applicationId);
      const newMessageObj = {
        sender: auth.currentUser.uid,
        content: newMessage.trim(),
        timestamp: Date.now()
      };
      await updateDoc(docRef, {
        conversations: arrayUnion(newMessageObj)
      });

      setMessages([...messages, newMessageObj]);
      setNewMessage('');
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessages = () => {
    return messages.map((message, index) => (
      <View key={index} style={[
        styles.messageContainer,
        message.sender === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage
      ]}>
        <Text style={styles.messageContent}>{message.content}</Text>
        <Text style={styles.messageTimestamp}>
          {new Date(message.timestamp).toLocaleString()}
        </Text>
      </View>
    ));
  };

  const renderBriefInfo = () => {
    if (!applicationInfo) return null;

    return (
      <View style={styles.briefInfoContainer}>
        <Text style={styles.briefInfoTitle}>{applicationInfo.companyName}</Text>
        <Text style={styles.briefInfoSubtitle}>{applicationInfo.role}</Text>
        {applicationInfo.interviewDate && (
          <Text style={styles.briefInfoText}>Interview Date: {applicationInfo.interviewDate}</Text>
        )}
        {applicationInfo.interviewMessage && (
          <Text style={styles.briefInfoText}>Message: {applicationInfo.interviewMessage}</Text>
        )}
      </View>
    );
  };

  return (
    <Layout>
      <TopNav
        middleContent="Conversation"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      {renderBriefInfo()}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={themeColor.primary} />
        ) : (
          <>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {renderMessages()}
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={styles.input}
                multiline
              />
              <Button 
                text={isSending ? "Sending..." : "Send"}
                onPress={sendMessage} 
                style={styles.sendButton} 
                textStyle={styles.sendButtonText}
                disabled={isSending || !newMessage.trim()}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Layout>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
      briefInfoContainer: {
        backgroundColor: themeColor.primary,
        padding: 15,
        borderBottomWidth: 0,
        borderBottomColor: themeColor.gray,
      },
      briefInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: themeColor.white,
      },
      briefInfoSubtitle: {
        fontSize: 16,
        color: themeColor.white,
        marginTop: 5,
      },
      briefInfoText: {
        fontSize: 14,
        color: themeColor.white,
        marginTop: 5,
      },
      messagesContainer: {
        flex: 1,
      },
      messagesContent: {
        padding: 10,
        paddingBottom: 20,
      },
      messageContainer: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
      },
      sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: themeColor.primary,
      },
      receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: themeColor.gray,
      },
      messageContent: {
        color: themeColor.white,
      },
      messageTimestamp: {
        color: themeColor.white200,
        fontSize: 10,
        marginTop: 5,
      },
      inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: themeColor.gray,
      },
      input: {
        padding: 15,
        borderWidth: 1,
        borderColor: themeColor.gray,
        borderRadius: 25,
        fontSize: 16,
        maxHeight: 100,
        minHeight: 50,
        marginBottom: 10,
      },
      sendButton: {
        height: 50,
        justifyContent: 'center',
        borderRadius: 25,
        marginTop: 10,
      },
      sendButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
      },
});