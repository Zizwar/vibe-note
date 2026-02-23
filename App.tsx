import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

// ─────────────── All available packages ───────────────
const PACKAGES = [
  { name: "expo", desc: "Core SDK", icon: "logo-react" },
  { name: "expo-audio", desc: "Audio playback & recording", icon: "musical-notes" },
  { name: "expo-file-system", desc: "File read/write/download", icon: "folder" },
  { name: "expo-sqlite", desc: "SQLite local database", icon: "server" },
  { name: "expo-font", desc: "Custom fonts loading", icon: "text" },
  { name: "expo-asset", desc: "Asset bundling", icon: "images" },
  { name: "expo-clipboard", desc: "Copy/paste clipboard", icon: "clipboard" },
  { name: "expo-haptics", desc: "Vibration feedback", icon: "pulse" },
  { name: "expo-sharing", desc: "Share files/content", icon: "share-social" },
  { name: "expo-image-picker", desc: "Pick images/videos", icon: "camera" },
  { name: "expo-camera", desc: "Camera access", icon: "videocam" },
  { name: "expo-location", desc: "GPS location", icon: "location" },
  { name: "expo-notifications", desc: "Push notifications", icon: "notifications" },
  { name: "expo-sensors", desc: "Accelerometer/Gyroscope", icon: "compass" },
  { name: "expo-local-authentication", desc: "Biometrics (Face/Fingerprint)", icon: "finger-print" },
  { name: "expo-secure-store", desc: "Encrypted key-value storage", icon: "lock-closed" },
  { name: "expo-web-browser", desc: "In-app browser", icon: "globe" },
  { name: "expo-brightness", desc: "Screen brightness control", icon: "sunny" },
  { name: "expo-keep-awake", desc: "Prevent screen sleep", icon: "eye" },
  { name: "expo-battery", desc: "Battery level & state", icon: "battery-half" },
  { name: "expo-network", desc: "Network info & connectivity", icon: "wifi" },
  { name: "expo-device", desc: "Device info", icon: "phone-portrait" },
  { name: "expo-constants", desc: "App constants & config", icon: "information-circle" },
  { name: "expo-linking", desc: "Deep links & URLs", icon: "link" },
  { name: "expo-status-bar", desc: "Status bar control", icon: "options" },
  { name: "react-native-reanimated", desc: "Advanced animations", icon: "color-wand" },
  { name: "react-native-gesture-handler", desc: "Touch gestures", icon: "hand-left" },
  { name: "react-native-safe-area-context", desc: "Safe area insets", icon: "resize" },
  { name: "react-native-screens", desc: "Native screen containers", icon: "layers" },
  { name: "zustand", desc: "State management", icon: "git-branch" },
  { name: "@expo/vector-icons", desc: "6000+ icons (Ionicons, FA, etc.)", icon: "star" },
] as const;

function DeviceInfo() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Device Info</Text>
      <Text style={styles.cardText}>Brand: {Device.brand ?? "N/A"}</Text>
      <Text style={styles.cardText}>Model: {Device.modelName ?? "N/A"}</Text>
      <Text style={styles.cardText}>OS: {Platform.OS} {Platform.Version}</Text>
      <Text style={styles.cardText}>Expo SDK: {Constants.expoConfig?.sdkVersion ?? "55"}</Text>
    </View>
  );
}

function PackageList() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {PACKAGES.length} Packages Ready
      </Text>
      {PACKAGES.map((pkg) => (
        <View key={pkg.name} style={styles.pkgRow}>
          <Ionicons
            name={pkg.icon as any}
            size={18}
            color="#046f98"
            style={styles.pkgIcon}
          />
          <View style={styles.pkgInfo}>
            <Text style={styles.pkgName}>{pkg.name}</Text>
            <Text style={styles.pkgDesc}>{pkg.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="rocket" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Expo 55 Starter</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome */}
          <View style={styles.welcome}>
            <Text style={styles.welcomeEmoji}>🚀</Text>
            <Text style={styles.welcomeTitle}>Ready to build!</Text>
            <Text style={styles.welcomeDesc}>
              SDK 55 template with {PACKAGES.length} packages pre-configured.
              Just import and use.
            </Text>
          </View>

          <DeviceInfo />
          <PackageList />

          <Text style={styles.footer}>
            expo@55.0.0-preview.7 • react-native@0.83.2 • react@19.2.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#046f98",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    backgroundColor: "#046f98",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcome: {
    alignItems: "center",
    paddingVertical: 24,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  welcomeDesc: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#046f98",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  pkgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  pkgIcon: {
    width: 28,
  },
  pkgInfo: {
    flex: 1,
  },
  pkgName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  pkgDesc: {
    fontSize: 11,
    color: "#999",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#bbb",
    marginTop: 20,
  },
});
