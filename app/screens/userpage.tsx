import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  getDoc,
  doc,
  runTransaction,
  Transaction,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notAvailableSticker from "../../assets/images/not.png";
import { arrayUnion } from "firebase/firestore";
import { debounce } from "lodash";
import { Dimensions } from "react-native";
import Orders from "./orders";
export interface Product {
  id: string;
  product_name: string;
  price: number;
  description: string;
  contact_no: number;
  stock: number;
  image_urls: string[];
  timestamp?: number;
  averageRating?: number;
  ratings?: { userId: string; rating: number }[];
}
// Improved debounce limit for rating
const debounceRateLimit = debounce(
  async (callback: (...args: any[]) => Promise<void>, ...args: any[]) => {
    await callback(...args);
  },
  2000
);

const Userpage: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("random");
  const [username, setUsername] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
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
    fetchUsername();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userId");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  // Fetch products and set up real-time listener
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);

        // Real-time listener for product updates
        const unsubscribe = onSnapshot(
          collection(db, "products"),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const updatedProduct = change.doc.data() as Product;
                setProducts((prevProducts) =>
                  prevProducts.map((p) =>
                    p.id === updatedProduct.id ? updatedProduct : p
                  )
                ); // Optimized update logic
              }
            });
          }
        );

        return () => unsubscribe(); // Cleanup listener on unmount
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Shuffle array function memoized
  const shuffleArray = useCallback((array: Product[]) => {
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const handleViewAR = useCallback(
    (product: Product) => {
      navigation.navigate("viewinar", { product });
    },
    [navigation]
  );
  const cart = useCallback(() => {
    navigation.navigate("cart");
  }, [navigation]);
  const about = useCallback(() => {
    navigation.navigate("about");
  }, [navigation]);
  const orders = useCallback(() => {
    navigation.navigate("orders");
  }, [navigation]);

  const handleViewdetails = useCallback(
    (product: Product) => {
      navigation.navigate("viewdetails", { product });
    },
    [navigation]
  );

  const performSearch = useCallback(
    (query: string) => {
      if (query.trim() === "") {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);

      const q = query.toLowerCase();
      const filteredProducts = products.filter(
        (product) =>
          (product.product_name?.toLowerCase().includes(q) ||
            product.description?.toLowerCase().includes(q)) &&
          product
      );

      setTimeout(() => {
        setSearchResults(filteredProducts);
        setSearching(false);
      }, 500); // Adjust timeout as needed
    },
    [products]
  );

  const handleCancel = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
  };

  const getMostRecentProductIds = useMemo(() => {
    const sortedByTimestamp = [...products].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );
    return sortedByTimestamp.slice(0, 5).map((product) => product.id);
  }, [products]);

  // Memoize the sorting function to avoid unnecessary re-sorting
  const sortProducts = useCallback(() => {
    let sortedProducts = [
      ...(searchResults.length > 0 ? searchResults : products),
    ];

    switch (sortBy) {
      case "priceLowToHigh":
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case "priceHighToLow":
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case "latest":
        sortedProducts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        break;
      case "random":
        sortedProducts = shuffleArray(sortedProducts);
        break;
    }

    return sortedProducts;
  }, [sortBy, searchResults, products, shuffleArray]);

  const handleAddToCart = async (product: Product) => {
    try {
      // Check if the product is in stock
      if (product.stock <= 0) {
        alert("Item is out of stock.");
        return; // Ensure this return statement exits the function immediately
      }

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
        quantity: 1, // Default quantity
        imageUrl: product.image_urls[0], // Add the image URL
        timestamp: new Date(),
      });

      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("An error occurred while adding the product to the cart.");
    }
  };

  // Function to handle rating submissions
  const handleRating = async (productId: string, rating: number) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const productDocRef = doc(db, "products", productId);

      await runTransaction(db, async (transaction: Transaction) => {
        const productDocSnapshot = await transaction.get(productDocRef);
        if (!productDocSnapshot.exists()) {
          throw new Error("Product does not exist");
        }

        const productData = productDocSnapshot.data() as Product;
        const existingRatings = productData.ratings || [];

        // Filter out the existing rating by this user
        const updatedRatings = existingRatings.filter(
          (r) => r.userId !== userId
        );
        updatedRatings.push({ userId, rating });

        const averageRating =
          updatedRatings.reduce((acc, curr) => acc + curr.rating, 0) /
          updatedRatings.length;

        transaction.update(productDocRef, {
          ratings: updatedRatings,
          averageRating,
        });

        // Optimistic UI update
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productId
              ? { ...product, ratings: updatedRatings, averageRating }
              : product
          )
        );
      });
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const debouncedHandleRating = useCallback(
    (productId: string, rating: number) => {
      debounceRateLimit(() => handleRating(productId, rating));
    },
    []
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => {
      const isLatest = getMostRecentProductIds.includes(item.id);
      const topImageUrl = item.image_urls[0];
      const isNotAvailable = item.stock === 0;

      return (
        <View style={styles.productCard}>
          <TouchableOpacity
            onPress={() => {}}
            activeOpacity={1} // Disable the default opacity effect
          >
            <View>
              {topImageUrl ? (
                <Image
                  source={{ uri: topImageUrl }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text>No Image Available</Text>
                </View>
              )}
              {isLatest && (
                <Image
                  source={require("../../assets/images/new.png")}
                  style={styles.latestSticker}
                />
              )}
              {isNotAvailable && (
                <Image
                  source={notAvailableSticker}
                  style={styles.notAvailableSticker}
                />
              )}
            </View>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.productPrice}>Price: ${item.price}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
            <Text style={styles.productContact}>
              Contact: {item.contact_no}
            </Text>
            <Text style={styles.productRating}>
              Rating:{" "}
              {item.averageRating
                ? item.averageRating.toFixed(1)
                : "Not Rated Yet"}
            </Text>
            <View style={styles.ratingContainer}>
              {["😡", "😟", "😐", "😊", "😍"].map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => debouncedHandleRating(item.id, index + 1)}
                >
                  <Text style={styles.ratingEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.butto, styles.arButton]}
              onPress={() => handleViewAR(item)}
            >
              <Text style={styles.arButtonText}>Mixed Reality</Text>
            </TouchableOpacity>
            {!isNotAvailable && (
              <TouchableOpacity
                style={[styles.butto, styles.addToCartButton]}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.buttonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.butto, styles.vdButton]}
              onPress={() => handleViewdetails(item)}
            >
              <Text style={styles.buttonText}>View More</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      handleViewAR,
      getMostRecentProductIds,
      handleViewdetails,
      cart,
      debouncedHandleRating,
    ]
  );

  const renderFilteredProducts = useCallback(() => {
    const sortedProducts = sortProducts();

    if (searching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }

    if (searchQuery !== "" && searchResults.length === 0) {
      return (
        <View style={styles.centered}>
          <Text>No results found.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={sortedProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false} // Hide scrollbar
      />
    );
  }, [searching, sortProducts, searchQuery, searchResults, renderProductItem]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/adapi.png")}
          style={[styles.projectIcon, { borderWidth: 0 }]}
        />
        {/* <Text style={styles.title}> {username ? username : "User"}</Text> */}
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => {
              orders();
            }}
            style={styles.iconButton}
          >
            <Ionicons name="file-tray-outline" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              cart();
            }}
          >
            <Ionicons name="cart-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              about();
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="black"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={24}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (!searching) {
              setSearching(true);
            }
            clearTimeout(timeout);
            timeout = setTimeout(() => performSearch(text), 500); // Adjust timeout as needed
          }}
        />
        {searching && (
          <ActivityIndicator
            size="small"
            color="#0000ff"
            style={styles.loadingIcon}
          />
        )}
        {searchQuery !== "" && !searching && (
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons
              name="close-circle-outline"
              size={24}
              color="black"
              style={styles.cancelIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown for sorting */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortText}>Sort by: </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sortBy}
            style={styles.picker}
            onValueChange={(itemValue) => setSortBy(itemValue)}
          >
            <Picker.Item label="Random" value="random" />
            <Picker.Item label="Latest Arrivals" value="latest" />
            <Picker.Item label="Price: Low to High" value="priceLowToHigh" />
            <Picker.Item label="Price: High to Low" value="priceHighToLow" />
          </Picker>
        </View>
      </View>

      {renderFilteredProducts()}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© ArShop</Text>
      </View>
    </View>
  );
};

let timeout: NodeJS.Timeout;
const { width } = Dimensions.get("window");
const buttonWidth = width > 400 ? 120 : 100;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
    backgroundColor: "transparent",
  },
  projectIcon: {
    width: 40,
    height: 40,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },

  iconButton: {
    padding: 2,
  },

  footer: {
    padding: -20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "800",
    marginBottom: -10,
    marginLeft: -10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3498DB",
    marginLeft: -75,
  },
  butto: {
    width: buttonWidth,
    margin: 5,
    borderRadius: 5,
    paddingVertical: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 5,
    marginBottom: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: -3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    fontSize: 16,
    borderRadius: 25,
  },
  cancelIcon: {
    marginLeft: 10,
  },
  addToCartButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  loadingIcon: {
    position: "absolute",
    right: 25,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sortText: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  ratingContainer: {
    flexDirection: "row",
    left: -8,
  },
  ratingEmoji: {
    fontSize: 16,
    marginHorizontal: 5,
    marginBottom: 8,
  },
  productRating: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#F62F05",
  },
  picker: {
    height: 40,
    width: "100%",
  },
  productsList: {
    flexGrow: 1,
  },
  productCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  latestSticker: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 50,
    height: 50,
  },
  notAvailableSticker: {
    position: "absolute",
    top: 10,
    left: 33,
    width: 100,
    height: 100,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    marginBottom: 8,
    color: "#D4AF37",
    fontWeight: "bold",
  },
  productDescription: {
    marginBottom: 12,
    textAlign: "justify",
  },
  productContact: {
    color: "#FF7F7F",
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  arButton: {
    backgroundColor: "#007bff",
  },
  arButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  vdButton: {
    backgroundColor: "#Ff4500",
  },
  vdButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Userpage;
