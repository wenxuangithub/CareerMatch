import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PieChart } from 'react-native-chart-kit';

type StudentInterviewStatusProps = NativeStackScreenProps<MainStackParamList, "StudentInterviewStatus">;

interface Application {
  id: string;
  status: 'awaiting' | 'interview' | 'drop';
  companyName: string;
  role: string;
  interviewDate?: string;
  interviewMessage?: string;
}

export default function StudentInterviewStatus({ navigation }: StudentInterviewStatusProps) {
  const { isDarkmode } = useTheme();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const q = query(
        collection(db, "JobApplication"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const apps: Application[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { awaiting: 0, interview: 0, drop: 0 };
    applications.forEach((app) => {
      counts[app.status]++;
    });
    return counts;
  };

  const renderPieChart = () => {
    const counts = getStatusCounts();
    const data = [
      { name: 'Awaiting', population: counts.awaiting, color: themeColor.warning, legendFontColor: '#7F7F7F', legendFontSize: 12 },
      { name: 'Interview', population: counts.interview, color: themeColor.success, legendFontColor: '#7F7F7F', legendFontSize: 12 },
      { name: 'Dropped', population: counts.drop, color: themeColor.danger, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    ];

    return (
      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#eff3ff',
            backgroundGradientTo: '#efefef',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderApplications = () => {
    return applications.map((app) => (
      <TouchableOpacity 
        key={app.id} 
        style={styles.applicationCard}
        onPress={() => navigation.navigate("ConversationPage", { applicationId: app.id })}
      >
        <Text style={styles.companyName}>{app.companyName}</Text>
        <Text style={styles.role}>{app.role}</Text>
        <Text style={styles.status}>Status: {app.status.charAt(0).toUpperCase() + app.status.slice(1)}</Text>
        {app.status === 'interview' && (
          <>
            <Text style={styles.interviewDate}>Interview Date: {app.interviewDate}</Text>
            <Text style={styles.interviewMessage}>Message: {app.interviewMessage}</Text>
          </>
        )}
      </TouchableOpacity>
    ));
  };


  return (
    <Layout>
      <TopNav
        middleContent="Interview Status"
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
        {isLoading ? (
          <ActivityIndicator size="large" color={themeColor.primary} />
        ) : (
          <>
            {renderPieChart()}
            <Text style={styles.sectionTitle}>Your Applications</Text>
            {renderApplications()}
          </>
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  applicationCard: {
    backgroundColor: themeColor.gray,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: themeColor.white,
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
  },
  interviewDate: {
    fontSize: 14,
    marginTop: 5,
  },
  interviewMessage: {
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
});