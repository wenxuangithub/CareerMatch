import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Layout, Text, TopNav, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LineChart } from "react-native-chart-kit";

type EmployerEventAnalyticProps = NativeStackScreenProps<MainStackParamList, "EmployerEventAnalytic">;

export default function EmployerEventAnalytic({ route, navigation }: EmployerEventAnalyticProps) {
  const { isDarkmode } = useTheme();
  const { eventId, companyId } = route.params;
  const [isExporting, setIsExporting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });

  const db = getFirestore();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const jobApplicationsRef = collection(db, "JobApplication");
      const q = query(jobApplicationsRef, 
        where("eventId", "==", eventId),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);
      const apps = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const userData = await getUserData(data.userId);
        apps.push({ id: doc.id, ...data, userData });
      }
      setApplications(apps);
      updateChartData(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Alert.alert("Error", "Failed to fetch applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartData = (apps) => {
    const statusCounts = {
      'awaiting': 0,
      'interview': 0,
      'drop': 0
    };
    apps.forEach(app => {
      statusCounts[app.status || 'awaiting']++;
    });
    setChartData({
      labels: ["Awaiting", "Interview", "Dropped"],
      datasets: [{
        data: [statusCounts.awaiting, statusCounts.interview, statusCounts.drop]
      }]
    });
  };

  const getUserData = async (userId: string) => {
    const userDocRef = doc(db, "user", userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : {};
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Query all job applications for this event and company
      const jobApplicationsRef = collection(db, "JobApplication");
      const q = query(jobApplicationsRef, 
        where("eventId", "==", eventId),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);

      let csvContent = "Time,Name,Phone,Email,Resume,Role\n";

      for (const doc of querySnapshot.docs) {
        const applicationData = doc.data();
        const userData = await getUserData(applicationData.userId);
        
        const row = [
          new Date(applicationData.date.toDate()).toLocaleString(),
          userData.displayName || "N/A",
          userData.phone || "N/A",
          userData.email || "N/A",
          userData.pdfURL || "N/A",
          applicationData.role
        ].map(field => `"${field}"`).join(",");

        csvContent += row + "\n";
      }

      const fileName = `JobApplications.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(filePath, { UTI: '.csv', mimeType: 'text/csv' });

      Alert.alert("Success", "CSV file has been generated and shared.");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      Alert.alert("Error", "Failed to export data to CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  const handleApplicationPress = (application) => {
    navigation.navigate("JobApplicationDetails", { application });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'interview':
        return <Ionicons name="calendar" size={24} color={themeColor.success} />;
      case 'drop':
        return <Ionicons name="close-circle" size={24} color={themeColor.danger} />;
      default:
        return <Ionicons name="time" size={24} color={themeColor.warning} />;
    }
  };

  const renderApplicationItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleApplicationPress(item)} style={styles.applicationItem}>
      {getStatusIcon(item.status)}
      <View style={styles.applicationItemText}>
        <Text>{item.userData.displayName || 'Unknown'}</Text>
        <Text>{item.role}</Text>
        <Text>{new Date(item.date.toDate()).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <TopNav
        middleContent="Event Analytics"
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
        <Text style={styles.title}>Job Applications Analytics</Text>
        
        {!isLoading && (
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#00008b",  // Dark blue background
              backgroundGradientFrom: "#00008b",  // Gradient starts with dark blue
              backgroundGradientTo: "#00008b",  // Gradient ends with dark blue
              decimalPlaces: 2,  // optional, defaults to 2 decimal places
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        )}

        <Button
          text={isExporting ? "Exporting..." : "Export to CSV"}
          onPress={exportToCSV}
          style={styles.exportButton}
          disabled={isExporting}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color={themeColor.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplicationItem}
            keyExtractor={(item) => item.id}
            style={styles.applicationList}
          />
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  exportButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  applicationList: {
    flex: 1,
  },
  applicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  applicationItemText: {
    marginLeft: 10,
  },
});