import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: StackNavigationProp<any>;
};

const AdminPanel: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch and set username from AsyncStorage or Firestore
    const fetchUsername = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const userDocRef = doc(db, "users", userId);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            setUsername(userData.name); // Assuming 'name' is stored in Firestore
          } else {
            setUsername(null); // Handle case where user data doesn't exist
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, []);

  const handleLogout = async () => {
    // Implement logout functionality
    await AsyncStorage.removeItem("userId");
    // Reset navigation stack to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleChangeUsername = () => {
    navigation.navigate("editusername"); // Navigate to Editusername screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      <Text style={styles.welcome}>
        {username ? `Welcome ${username}` : "Welcome User"}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSkyBlue]}
          onPress={() => navigation.navigate("listuser")}
        >
          <Text style={styles.buttonText}>Go to List Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonBlue]}
          onPress={() => navigation.navigate("insertproduct")}
        >
          <Text style={styles.buttonText}>Insert Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonOrange]}
          onPress={() => navigation.navigate("viewproducts")}
        >
          <Text style={styles.buttonText}>View Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonBlue]}
          onPress={() => navigation.navigate("vieworders")}
        >
          <Text style={styles.buttonText}>View orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonGreen]} // Added a new style for "Change Username" button
          onPress={handleChangeUsername} // Handle navigation to Editusername screen
        >
          <Text style={styles.buttonText}>Change Username</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonRed]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  welcome: {
    fontSize: 20,
    color: "#555",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginVertical: 10,
  },
  buttonSkyBlue: {
    backgroundColor: "skyblue",
  },
  buttonBlue: {
    backgroundColor: "blue",
  },
  buttonOrange: {
    backgroundColor: "orange",
  },
  buttonGreen: {
    backgroundColor: "green", // Added a new color for "Change Username" button
  },
  buttonRed: {
    backgroundColor: "red",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AdminPanel;
