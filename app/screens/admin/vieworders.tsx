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
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const Vieworders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersQuery = collection(db, "orders");

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

  const renderOrderItem = ({ item }: { item: any }) => {
    const totalPrice = item.totalPrice || 0;

    // Assuming orderDate is a string
    const formattedOrderDate = new Date(item.orderDate);

    // Extract the shipping address
    const { province, district, city, address, phone, paymentStatus } = item;

    return (
      <View style={styles.orderContainer}>
        <Text style={styles.orderTitle}>
          Order Date: {formattedOrderDate.toLocaleDateString()} at{" "}
          {formattedOrderDate.toLocaleTimeString()}
        </Text>

        <Text style={styles.shippingAddress}>
          Shipping address: {province}, {district}, {city}, {address}, {phone}
        </Text>
        <Text style={styles.paymentStatus}>
          Payment Status: {paymentStatus || "Not specified"}
        </Text>

        {item.items.map((product: any, index: number) => {
          const productPrice = product.price || 0;
          const totalItemPrice = productPrice * (product.quantity || 1);

          return (
            <View key={index} style={styles.productRow}>
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

        <Text style={styles.orderTotal}>
          Overall Total: Rs. {totalPrice.toFixed(2)}
        </Text>
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
    fontStyle: "italic",
    color: "black",
    marginBottom: 16,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentStatus: {
    fontSize: 16,
    color: "#3498db",
    marginBottom: 16,
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
    fontSize: 18,
    color: "#888",
  },
  loadingText: {
    fontSize: 18,
    color: "#444",
  },
});

export default Vieworders;
