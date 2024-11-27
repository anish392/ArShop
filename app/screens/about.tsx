// about.tsx
import React from "react";
import { SafeAreaView, StatusBar, View, Text, StyleSheet } from "react-native";

const About = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.text}>© ArShop</Text>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
  },
  text: {
    fontSize: 24,
    color: "#4b0082",
    fontFamily: "System",
  },
});

export default About;
