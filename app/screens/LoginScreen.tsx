import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false); // State to manage error visibility
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthState(); // Check if user is already authenticated on component mount
  }, []);

  const checkAuthState = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (userId) {
      // User is already authenticated, navigate to appropriate screen based on role
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;
        if (userRole === "admin") {
          navigation.replace("AdminPanel"); // Use replace to prevent back navigation to login screen
        } else {
          navigation.replace("UserHome"); // Use replace to prevent back navigation to login screen
        }
      } else {
        console.log("No such user document!");
      }
    }
  };

  const handleLogin = () => {
    // Check if email or password fields are empty
    if (!email.trim()) {
      setError("Email field cannot be empty. Please fill in your email.");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 6000);
      return;
    }

    if (!password.trim()) {
      setError("Password field cannot be empty. Please fill in your password.");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 6000);
      return;
    }
    setLoading(true);
    // Proceed with Firebase authentication
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        if (user) {
          const userId = user.uid;
          const userDoc = await getDoc(doc(db, "users", userId));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role;

            await AsyncStorage.setItem("userId", userId);
            setEmail("");
            setPassword("");
            if (userRole === "admin") {
              navigation.replace("AdminPanel"); // Use replace to prevent back navigation to login screen
            } else {
              navigation.replace("UserHome"); // Use replace to prevent back navigation to login screen
            }
          } else {
            console.log("No such user document!");
          }
        } else {
          console.log("User not found");
        }
        setLoading(false); // Stop loading
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        // Handle specific Firebase authentication errors here if needed
        setError("Invalid email or password. Please check your credentials.");
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
        }, 6000);
        setLoading(false);
      });
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/1257860/pexels-photo-1257860.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {showError && error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#3b5998",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
