import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

type ProvinceData = {
  [key: string]: {
    districts: {
      [key: string]: string[];
    };
  };
};

const provinces: ProvinceData = {
  province1: {
    districts: {
      Jhapa: ["Bhadrapur"],
      Ilam: ["Ilam"],
      Panchthar: ["Phidim"],
      Taplejung: ["Taplejung"],
      Sankhuwasabha: ["Khadabari"],
      Terhathum: ["Myanglung"],
      Bhojpur: ["Jhayaupokhari"],
      Dhankuta: ["Dhankuta"],
      Khotang: ["Diktel"],
      Sunsari: ["Inarhuwa"],
      Morang: ["Biratnagar"],
      Solukhumbu: ["Salleri"],
      Okhaldhunga: ["Siddhicharan"],
      Udaypur: ["Gaighat"],
    },
  },
  province2: {
    districts: {
      Bara: ["Kalaiya"],
      Dhanusa: ["Janakpur"],
      Mahottari: ["Jaleswar"],
      Parsa: ["Birgunj"],
      Rautahat: ["Gaur"],
      Saptari: ["Rajbiraj"],
      Sarlahi: ["Malangwa"],
      Siraha: ["Siraha"],
    },
  },
};

const SignupScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Loading state

  // District and city data
  const districtOptions =
    province && provinces[province]
      ? Object.keys(provinces[province].districts)
      : [];
  const cityOptions =
    district && province && provinces[province]
      ? provinces[province].districts[district]
      : [];

  const handleSignup = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    // Check if name, email, or password fields are empty
    if (!name.trim()) {
      setError("Username field cannot be empty. Please fill in your name.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }
    if (name.trim().length < 5) {
      setError("Name must be at least 5 characters long.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number field cannot be empty.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }
    if (!phoneRegex.test(phoneNumber)) {
      setError("Phone number must be a valid 10-digit number.");
      return;
    }
    if (!province || !district || !city) {
      setError("Please select a  province, district, and city.");
      return;
    }

    if (!address.trim()) {
      setError("Address cannot be empty.");
      return;
    }
    if (!email.trim()) {
      setError("Email field cannot be empty. Please fill in your email.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }

    if (!password.trim()) {
      setError("Password field cannot be empty. Please fill in your password.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }

    // Check password complexity requirements
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d.*\d)(?=.*[a-z]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must contain at least one capital letter, two numbers, and be at least 6 characters long."
      );
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      return;
    }

    setLoading(true); // Start loading
    // Check if username already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setError("Username already exists. Please choose a different username.");
      setTimeout(() => {
        setError(null); // Clear error message after 6 seconds
      }, 6000);
      setLoading(false);
      return;
    }

    // Proceed with Firebase authentication
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed up successfully, now store additional user data in Firestore
        const user = userCredential.user;
        if (user) {
          const userId = user.uid; // Firebase generated user ID (uid)

          // Add user to Firestore with uid as document ID
          await setDoc(doc(db, "users", userId), {
            userId: userId,
            name: name,
            email: email,
            phone: phoneNumber,
            address: address,
            province: province,
            district: district,
            city: city,
            role: "user", // Default role as "user"
          });

          // Save user ID to AsyncStorage after successful signup
          await AsyncStorage.setItem("userId", userId);

          // Clear input fields
          setName("");
          setEmail("");
          setPassword("");
          setPhoneNumber("");
          setAddress("");
          setProvince(null);
          setDistrict(null);
          setCity(null);

          // Show success alert
          Alert.alert("Success", "Successfully signed up!", [
            { text: "OK", onPress: () => navigation.replace("UserHome") },
          ]);
        } else {
          // Handle case where user is null (should not happen in signup flow)
          setError("User is null");
          setTimeout(() => {
            setError(null); // Clear error message after 6 seconds
          }, 6000);
        }
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        // Display user-friendly error messages for common issues
        if (error.code === "auth/invalid-email") {
          setError("Invalid email format. Please check your email.");
        } else if (error.code === "auth/weak-password") {
          setError("Password is too weak. Please use a stronger password.");
        } else if (error.code === "auth/email-already-in-use") {
          setError("Email already in use. Please use a different email.");
        } else {
          setError("Signup failed. Please try again later.");
        }
        setTimeout(() => {
          setError(null); // Clear error message after 6 seconds
        }, 6000);
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
        <Text style={styles.title}>Signup</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <View style={styles.pickerContainer}>
          <Picker
            key={province}
            selectedValue={province}
            onValueChange={(itemValue) => {
              setProvince(itemValue);
              setDistrict(null); // Reset district and city when province changes
              setCity(null);
            }}
          >
            <Picker.Item label="Select Province" value={null} />
            <Picker.Item label="Province 1" value="province1" />
            <Picker.Item label="Province 2" value="province2" />
          </Picker>
        </View>
        {/* District Picker */}
        {province && (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={district}
              onValueChange={(itemValue) => {
                setDistrict(itemValue);
                setCity(null); // Reset city when district changes
              }}
            >
              <Picker.Item label="Select District" value={null} />
              {districtOptions.map((dist) => (
                <Picker.Item key={dist} label={dist} value={dist} />
              ))}
            </Picker>
          </View>
        )}

        {district && (
          <View style={styles.pickerContainer}>
            <Picker key={district} selectedValue={city} onValueChange={setCity}>
              <Picker.Item label="Select City" value={null} />
              {cityOptions.map((cityName) => (
                <Picker.Item key={cityName} label={cityName} value={cityName} />
              ))}
            </Picker>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Tole name, chowk, specific landmark"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onBlur={() => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email.trim())) {
              setError("Email must be valid. Please check your email format.");
            } else {
              setError(null);
            }
          }}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
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
  pickerContainer: {
    height: 50,
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 25,
    backgroundColor: "#fff",
    marginBottom: 15,
    justifyContent: "center", // Center the picker vertically
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

export default SignupScreen;
