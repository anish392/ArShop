import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Asset } from "expo-asset";

const UserHome = ({ navigation }: { navigation: any }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video | null>(null);

  const videoUri =
    "https://cdn.pixabay.com/video/2020/08/30/48569-454825064_large.mp4";

  useEffect(() => {
    const prepareVideo = async () => {
      try {
        await Asset.loadAsync(videoUri);
      } catch (error) {
        console.error("Error preloading video:", error);
        setVideoError(true);
      }
    };

    const fetchUsername = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const userDocRef = doc(db, "users", userId);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            setUsername(userData.name);
          } else {
            setUsername(null);
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    prepareVideo();
    fetchUsername();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userId");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && !isVideoReady) {
      setIsVideoReady(true);
    }
  };

  const [imageError, setImageError] = useState(false);
  const renderBackground = () => {
    if (videoError) {
      return (
        <Image
          source={{
            uri: "https://images.pexels.com/photos/1257860/pexels-photo-1257860.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        style={StyleSheet.absoluteFill}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={(error) => {
          console.error("Video playback error:", error);
          setVideoError(true);
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderBackground()}
      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome {username ? username : "User"}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3498db" }]}
          onPress={() => navigation.navigate("userpage")}
        >
          <Text style={styles.buttonText}>Go to Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2ecc71", marginTop: 16 }]}
          onPress={() => navigation.navigate("editusername")}
        >
          <Text style={styles.buttonText}>Change UserName</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#e74c3c", marginTop: 16 }]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "white",
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
});

export default UserHome;
