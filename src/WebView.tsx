import React from 'react';
import { WebView } from 'react-native-webview';
import { Layout, TopNav, useTheme, themeColor } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types/navigation";

export default function ({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, "WebView">) {
  const { isDarkmode } = useTheme();
  const { url } = route.params;

  return (
    <Layout>
      <TopNav
        middleContent="Web View"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
      />
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
      />
    </Layout>
  );
}