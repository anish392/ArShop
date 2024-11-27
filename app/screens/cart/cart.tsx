import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Product } from "../userpage";

const Cart: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [inputVisible, setInputVisible] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("1");
  const [selectedCartItem, setSelectedCartItem] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) throw new Error("User not authenticated");

        const cartQuery = query(
          collection(db, "cart"),
          where("userId", "==", userId)
        );

        const unsubscribe = onSnapshot(cartQuery, async (cartSnapshot) => {
          const items = await Promise.all(
            cartSnapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data();

              if (!data) {
                console.warn(`Cart item ${docSnapshot.id} has no data`);
                return null;
              }

              const productRef = doc(db, "products", data.productId);
              const productSnapshot = await getDoc(productRef);

              if (!productSnapshot.exists()) {
                console.warn(`Product ${data.productId} does not exist`);
                return null;
              }

              const productData = productSnapshot.data() as Product;

              if (productData.stock === 0) {
                await deleteDoc(doc(db, "cart", docSnapshot.id));
                return null;
              }

              return {
                ...productData,
                quantity: data.quantity,
                cartId: docSnapshot.id,
              };
            })
          );

          const filteredItems = items.filter((item) => item !== null);

          setCartItems(filteredItems);
          updateTotalPrice(filteredItems);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    fetchCartItems();
  }, []);

  const updateTotalPrice = (items: any[]) => {
    const price = items.reduce(
      (acc, item) => acc + (item.price || 0) * item.quantity,
      0
    );
    setTotalPrice(price);
  };

  const handleUpdateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 100) newQuantity = 100;

    try {
      const cartItem = cartItems.find((item) => item.cartId === cartId);
      if (!cartItem) {
        console.error("Cart item not found");
        return;
      }

      if (newQuantity > cartItem.stock) {
        Alert.alert(
          `${cartItem.product_name} is out of stock`,
          `Only ${cartItem.stock} item(s) available`
        );
        return;
      }

      const cartDoc = doc(db, "cart", cartId);
      await updateDoc(cartDoc, { quantity: newQuantity });

      const updatedItems = cartItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      );

      setCartItems(updatedItems);
      updateTotalPrice(updatedItems);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveFromCart = async (cartId: string) => {
    try {
      await deleteDoc(doc(db, "cart", cartId));
      const updatedItems = cartItems.filter((item) => item.cartId !== cartId);
      setCartItems(updatedItems);
      updateTotalPrice(updatedItems);
      Alert.alert("Item removed from cart!");
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleInputChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setInputValue(numericValue);
  };

  const handleUpdateInput = async () => {
    if (selectedCartItem && inputValue) {
      const newQuantity = parseInt(inputValue, 10);
      await handleUpdateQuantity(selectedCartItem, newQuantity);
      setInputVisible(false);
      setInputValue("1");
      setSelectedCartItem(null);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const price = parseFloat(item.price);

    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.image_urls[0] }}
          style={styles.productImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.productPrice}>Rs {price.toFixed(2)}</Text>
          <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
          {item.quantity > 10 ? (
            <>
              {inputVisible && selectedCartItem === item.cartId ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={inputValue}
                    onChangeText={handleInputChange}
                    maxLength={3}
                  />
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdateInput}
                  >
                    <Text style={styles.updateButtonText}>Update</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={() => {
                    setSelectedCartItem(item.cartId);
                    setInputVisible(true);
                  }}
                >
                  <Text style={styles.inputButtonText}>Enter Quantity</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleUpdateQuantity(item.cartId, item.quantity - 1)
                }
                disabled={item.quantity <= 1}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleUpdateQuantity(item.cartId, item.quantity + 1)
                }
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromCart(item.cartId)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.cartId}
        contentContainerStyle={styles.cartContentContainer}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          Total Price: Rs {totalPrice.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => navigation.navigate("payment")}
        >
          <Text style={styles.buyButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f1f1f1",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cartItem: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    color: "#e67e22",
    marginVertical: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dcdcdc",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    marginRight: 10,
  },
  updateButton: {
    backgroundColor: "#27ae60",
    padding: 10,
    borderRadius: 5,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputButton: {
    backgroundColor: "#3498db",
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  inputButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  totalContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  cartContentContainer: {
    paddingBottom: 20,
  },
  buyButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#27ae60",
    borderRadius: 10,
    alignItems: "center",
  },
  buyButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Cart;
