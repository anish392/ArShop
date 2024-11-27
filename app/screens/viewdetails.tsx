import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../components/navigation/AuthStackNavigator";
import Ionicons from "react-native-vector-icons/Ionicons";
import notAvailableSticker from "../../assets/images/not.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDoc,
  doc,
  runTransaction,
  Transaction,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { Product } from "./userpage";

type ViewdetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "viewdetails"
>;
type ViewdetailsScreenRouteProp = RouteProp<RootStackParamList, "viewdetails">;

type ViewdetailsProps = {
  navigation: ViewdetailsNavigationProp;
  route: ViewdetailsScreenRouteProp;
};

const Viewdetails: React.FC<ViewdetailsProps> = ({ route, navigation }) => {
  const { product } = route.params;
  const imageUrls = Array.isArray(product.image_urls) ? product.image_urls : [];
  const isNotAvailable = product.stock === 0;

  const cart = useCallback(() => {
    navigation.navigate("cart");
  }, [navigation]);

  const goToIndex = useCallback(() => {
    navigation.navigate("UserHome");
  }, [navigation]);
  const handleAddToCart = async (product: Product) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const cartRef = collection(db, "cart");
      // Query to check if the item is already in the cart for this user
      const cartQuery = await getDocs(
        query(
          cartRef,
          where("userId", "==", userId),
          where("productId", "==", product.id)
        )
      );

      if (!cartQuery.empty) {
        // Item already exists in the cart
        alert("Item is already present in the cart.");
        return;
      }

      // If not present, add the item to the cart
      await addDoc(cartRef, {
        userId,
        productId: product.id,
        quantity: 1, // Default quantity, you might want to let the user choose this
        timestamp: new Date(),
      });

      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("An error occurred while adding the product to the cart.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToIndex}>
          <Image
            source={require("../../assets/images/adapi.png")}
            style={[styles.projectIcon, { borderWidth: 0 }]}
          />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              cart();
            }}
          >
            <Ionicons name="cart-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {imageUrls.length > 0 ? (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {isNotAvailable && (
              <Image
                source={notAvailableSticker}
                style={styles.notAvailableSticker}
              />
            )}
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.product_name}</Text>
          <Text style={styles.price}>{`$${product.price}`}</Text>
          <Text style={styles.contact}>{`Contact: ${product.contact_no}`}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
        {!isNotAvailable && (
          <TouchableOpacity
            style={[styles.butto, styles.addToCartButton]}
            onPress={() => handleAddToCart(product)}
          >
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© ArShop</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomColor: "#ccc",
    backgroundColor: "transparent",
  },
  backButton: {
    marginRight: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 4,
    marginRight: 4,
  },
  butto: {
    margin: 5,
    borderRadius: 5,
    paddingVertical: 8,
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: "#28a745",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  contentContainer: {
    alignItems: "center",
    padding: 16,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  placeholderImage: {
    width: 300,
    height: 300,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 16,
  },
  placeholderText: {
    color: "#888",
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 16,
  },
  notAvailableSticker: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "40%",
    resizeMode: "contain",
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 2,
  },
  footerText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "800",
    padding: 6,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 8,
  },
  projectIcon: {
    width: 40,
    height: 40,
    marginTop: 8,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 2,
  },
  contact: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#555",
  },
});

export default Viewdetails;
