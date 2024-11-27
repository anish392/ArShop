import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
  SafeAreaView,
  Button,
  ScrollView,
  Image,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../components/navigation/AuthStackNavigator";
import { CameraView, Camera, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { CameraType } from "expo-camera/build/legacy/Camera.types";
import { captureRef } from "react-native-view-shot";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type ViewinarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "viewinar"
>;
type ViewinarScreenRouteProp = RouteProp<RootStackParamList, "viewinar">;

type ViewinarProps = {
  navigation: ViewinarScreenNavigationProp;
  route: ViewinarScreenRouteProp;
};

const Viewinar: React.FC<ViewinarProps> = ({ route }) => {
  const { product } = route.params;

  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [permission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const [scale, setScale] = useState(1);
  const [angle, setAngle] = useState(0);
  const [permissionResponse, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();

  useEffect(() => {
    requestMediaLibraryPermission();
  }, [requestMediaLibraryPermission]);

  async function getAlbums() {
    if (!permissionResponse) {
      await requestMediaLibraryPermission();
      return;
    }

    if (permissionResponse.status !== "granted") {
      await requestMediaLibraryPermission();
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: pan.x,
            dy: pan.y,
          },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        // Additional actions upon release if needed
      },
    })
  ).current;

  const rotateImage = () => {
    setAngle((prevAngle) => prevAngle + 45);
  };

  const scaleImage = (factor: number) => {
    setScale((prevScale) => prevScale * factor);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          exif: false,
        });

        if (photo && photo.uri) {
          const timestamp = new Date().getTime();
          const newFilename = `viewinar_${timestamp}.jpg`;
          const newPath = `${FileSystem.documentDirectory}${newFilename}`;

          await FileSystem.moveAsync({
            from: photo.uri,
            to: newPath,
          });

          const asset = await MediaLibrary.createAssetAsync(newPath);
          await MediaLibrary.createAlbumAsync("ARshop", asset, false);

          Alert.alert("Image Captured", `Image saved to ${newPath}`, [
            { text: "OK" },
          ]);
        } else {
          throw new Error("Photo or photo.uri is undefined");
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
        Alert.alert("Error", "Failed to capture image");
      }
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Get the top image URL (first image in the array)
  const topImageUrl =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls[0]
      : null;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setFacing(
                facing === CameraType.back ? CameraType.front : CameraType.back
              )
            }
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={rotateImage}>
            <Ionicons name="reload" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={takePicture}>
            <Ionicons name="camera" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => scaleImage(1.2)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => scaleImage(0.8)}
          >
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {product.image_urls && (
          <Animated.Image
            {...panResponder.panHandlers}
            source={{ uri: topImageUrl }}
            style={[
              styles.overlayImage,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate: `${angle}deg` },
                  { scale: scale },
                ],
              },
            ]}
            resizeMode="contain"
          />
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    width: "100%",
  },
  iconButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 25,
  },
  buttonText: {},
  overlayImage: {
    position: "absolute",
    width: screenWidth / 2,
    height: screenHeight / 2,
    top: screenHeight / 4,
    left: screenWidth / 4,
  },
  albumContainer: {
    marginVertical: 10,
  },
  albumAssetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export default Viewinar;
