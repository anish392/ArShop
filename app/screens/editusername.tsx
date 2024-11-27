import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";

const Editusername = ({ navigation }: { navigation: any }) => {
  const [newUsername, setNewUsername] = useState("");
  const [previousUsername, setPreviousUsername] = useState("");
  const [editable, setEditable] = useState(false); // State to control editability
  const [error, setError] = useState<string | null>(null); // State for error messages

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const userDocRef = doc(db, "users", userId);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            setPreviousUsername(userData.name); // Set previous username
            setNewUsername(userData.name); // Initialize input with previous username
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, []);

  const handleEditToggle = () => {
    setEditable(!editable); // Toggle edit mode
  };

  const handleUsernameChange = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("name", "==", newUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Username already exists
          setError(
            "Username already exists. Please choose a different username."
          );
          return;
        }

        // Update username in Firestore
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          name: newUsername,
        });
        alert("Username updated successfully!");
        navigation.navigate("UserHome"); // Navigate back to UserHome after updating username
      }
    } catch (error) {
      console.error("Error updating username:", error);
      alert("Failed to update username.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Video Background */}
      <Video
        source={{
          uri: "https://cdn.pixabay.com/video/2020/08/30/48569-454825064_large.mp4",
        }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        style={StyleSheet.absoluteFill}
      />

      {/* Content Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.title}>Edit Username</Text>
        <TextInput
          style={[styles.input, editable ? null : styles.readOnly]}
          placeholder="Enter new username"
          value={newUsername}
          onChangeText={setNewUsername}
          editable={editable} // Toggle edit mode for the input
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!editable && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#3498db", marginTop: 16 },
            ]}
            onPress={handleEditToggle}
          >
            <Text style={styles.buttonText}>Edit Username</Text>
          </TouchableOpacity>
        )}
        {editable && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#3498db", marginTop: 16 },
            ]}
            onPress={handleUsernameChange}
          >
            <Text style={styles.buttonText}>Update Username</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent overlay
    padding: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "white",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
    marginBottom: 16,
    fontSize: 18,
  },
  readOnly: {
    backgroundColor: "#f0f0f0", // Background color for read-only mode
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default Editusername;
