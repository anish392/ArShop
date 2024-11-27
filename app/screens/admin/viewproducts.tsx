import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

interface Product {
  id: string;
  product_name: string;
  price: number;
  description: string;
  contact_no: number;
  image_urls: string;
  stock: string;
}

class ProductItem extends React.PureComponent<{
  item: Product;
  handleDelete: (id: string) => void;
  navigation: any;
}> {
  render() {
    const { item, handleDelete, navigation } = this.props;
    const topImage =
      item.image_urls.length > 0
        ? item.image_urls[0]
        : "https://via.placeholder.com/200"; // Default image if no images are available
    return (
      <View style={styles.productContainer}>
        <Image source={{ uri: topImage }} style={styles.productImage} />
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.productPrice}>Price: ${item.price}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <Text style={styles.productDescription}>{item.stock}</Text>
        <Text style={styles.contactInfo}>Contact: {item.contact_no}</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash" size={24} color="red" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("editproduct", { product: item })
            }
          >
            <Ionicons name="create" size={24} color="blue" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const ViewProducts = ({ navigation }: { navigation: any }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        {
          text: "No",
          onPress: () => console.log("Delete canceled"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", productId));
              setProducts((prevProducts) =>
                prevProducts.filter((product) => product.id !== productId)
              );
              Alert.alert("Success", "Product deleted successfully.");
            } catch (error) {
              console.error("Error deleting product: ", error);
              Alert.alert("Error", "Failed to delete product.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const performSearch = useCallback(
    async (query: string) => {
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

  const renderFilteredProducts = useCallback(() => {
    if (searching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    } else if (searchResults.length === 0 && searchQuery !== "") {
      return (
        <View style={styles.centered}>
          <Text>No results found.</Text>
        </View>
      );
    } else {
      return (
        <FlatList
          data={searchResults.length > 0 ? searchResults : products}
          renderItem={({ item }) => (
            <ProductItem
              item={item}
              handleDelete={handleDelete}
              navigation={navigation}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      );
    }
  }, [
    searchResults,
    searching,
    products,
    navigation,
    handleDelete,
    searchQuery,
  ]);

  return (
    <View style={styles.container}>
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
      {renderFilteredProducts()}
    </View>
  );
};

let timeout: NodeJS.Timeout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  productContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    color: "#D4AF37",
    fontWeight: "bold",
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    // color: "#666",
    marginBottom: 8,
    textAlign: "justify",
  },
  contactInfo: {
    fontSize: 16,
    color: "#00FF00",
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
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
    marginTop: 20,
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
  loadingIcon: {
    position: "absolute",
    right: 25,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ViewProducts;
