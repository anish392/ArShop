import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Timestamp } from "firebase/firestore";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId)
      );

      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(fetchedOrders);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchOrders();
  }, []);

  // Function to cancel an order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      Alert.alert(
        "Order cancelled",
        "Your order has been successfully cancelled."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to cancel the order.");
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const totalPrice = item.totalPrice || 0; // Fallback to 0 if undefined

    // Check if orderDate exists and is a string
    let formattedOrderDate: Date;
    if (typeof item.orderDate === "string") {
      const orderDateParts = item.orderDate.split(", ");
      const dateParts = orderDateParts[0].split("/");
      const timeParts = orderDateParts[1].split(" ");

      formattedOrderDate = new Date(
        `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}T${timeParts[0]}:00 ${timeParts[1]}`
      );
    } else {
      // Fallback to the current date if orderDate is invalid
      formattedOrderDate = new Date();
    }
    // Check if the order is within the 12-hour cancellation window
    const canCancelOrder =
      new Date().getTime() - formattedOrderDate.getTime() < 12 * 60 * 60 * 1000;

    // Extract the shipping address
    const { province, district, city, address, phone, paymentStatus } = item; // Directly from item

    return (
      <View style={styles.orderContainer}>
        {/* Format Date and Time here */}
        <Text style={styles.orderTitle}>
          Order Date: {formattedOrderDate.toLocaleDateString()} at{" "}
          {formattedOrderDate.toLocaleTimeString()}
        </Text>

        {/* Shipping address */}
        <Text style={styles.shippingAddress}>
          Shipping address: {province}, {district}, {city}, {address}
        </Text>
        <Text style={styles.paymentStatus}>
          Payment Status: {paymentStatus || "Not specified"}
        </Text>

        {/* Iterate through each product in the order */}
        {item.items.map((product: any, index: number) => {
          const productPrice = product.price || 0; // Fallback to 0 if undefined
          const totalItemPrice = productPrice * (product.quantity || 1); // Handle undefined quantity

          return (
            <View key={index} style={styles.productRow}>
              {/* Product Image */}
              <Image
                source={{ uri: product.productImage }}
                style={styles.productImage}
              />
              <View style={styles.productDetails}>
                <Text style={styles.productTitle}>{product.productTitle}</Text>
                <Text style={styles.productPrice}>
                  Price: Rs. {productPrice.toFixed(2)}
                </Text>
                <Text style={styles.productQuantity}>
                  Quantity: {product.quantity || 1}
                </Text>
                <Text style={styles.productTotalPrice}>
                  Total Item Price: Rs. {totalItemPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
        {/* Overall Total Price for the Order */}
        <Text style={styles.orderTotal}>
          Overall Total: Rs. {totalPrice.toFixed(2)}
        </Text>
        {/* Cancel button or expired message */}
        {canCancelOrder ? (
          <Text
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(item.id)}
          >
            Cancel Order
          </Text>
        ) : (
          <Text style={styles.cancelExpiredText}>
            Cancellation period expired
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {loading ? (
            <Text style={styles.loadingText}>Loading orders...</Text>
          ) : orders.length > 0 ? (
            <FlatList
              data={orders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <Text style={styles.noOrdersText}>No orders placed yet.</Text>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f8",
    padding: 16,
  },
  orderContainer: {
    width: "100%",
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentStatus: {
    fontSize: 16,
    color: "#3498db",
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    paddingBottom: 8,
  },
  shippingAddress: {
    fontSize: 16,
    color: "black",
    marginBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    color: "#fff", // Text color (white)
    backgroundColor: "#e74c3c", // Button background color (red)
    paddingVertical: 10, // Padding for top and bottom
    paddingHorizontal: 20, // Padding for sides
    textAlign: "center", // Center the text
    borderRadius: 20, // Make the edges rounded
    marginTop: 10, // Add some margin at the top
    alignSelf: "center", // Center the button within its container
  },

  cancelExpiredText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 10,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    marginRight: 16,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
  },
  productPrice: {
    fontSize: 14,
    color: "#27ae60",
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  productTotalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e74c3c",
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    color: "#2980b9",
  },
  listContainer: {
    paddingBottom: 16,
    width: "100%",
  },
  noOrdersText: {
    fontSize: 20,
    color: "#888",
  },
  loadingText: {
    fontSize: 18,
    color: "#444",
  },
});

export default Orders;
