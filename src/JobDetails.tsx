import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";

type JobDetailsProps = NativeStackScreenProps<MainStackParamList, "JobDetails">;

export default function JobDetails({ route, navigation }: JobDetailsProps) {
  const { isDarkmode } = useTheme();
  const { job, companyName } = route.params;

  return (
    <Layout>
      <TopNav
        middleContent="Job Details"
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
        <View style={styles.header}>
          <Text style={styles.jobTitle}>{job.role}</Text>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.jobLocation}>{job.location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={20} color={themeColor.primary} />
            <Text style={styles.detailText}>{job.classification}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color={themeColor.primary} />
            <Text style={styles.detailText}>{job.time}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.descriptions}</Text>
        </View>

        <Button
          text="Apply Now"
          onPress={() => {
            // Implement application logic here
            console.log("Apply for job:", job.role);
          }}
          style={styles.applyButton}
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
  header: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 18,
    color: themeColor.primary,
    marginBottom: 5,
  },
  jobLocation: {
    fontSize: 16,
    color: themeColor.gray,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  applyButton: {
    marginTop: 20,
  },
});