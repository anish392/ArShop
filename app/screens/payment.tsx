import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { writeBatch } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { RootStackParamList } from "@/components/navigation/AuthStackNavigator";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";

type City = string;
type District = {
  [key: string]: City[];
};
type Province = {
  districts: District;
};
type Provinces = {
  [key: string]: Province;
};

const provinces: Provinces = {
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

const PaymentPage: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          setPhone(userData.phone);
          setProvince(userData.province);
          setDistrict(userData.district);
          setCity(userData.city);
          setAddress(userData.address);
        } else {
          Alert.alert("User not found.");
        }
      }
    };

    fetchUserData();
  }, []);

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
              if (!data) return null;

              const productRef = doc(db, "products", data.productId);
              const productSnapshot = await getDoc(productRef);
              if (!productSnapshot.exists()) return null;

              const productData = productSnapshot.data();
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

  const validateInputs = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone.trim()) return "Phone number cannot be empty.";
    if (!phoneRegex.test(phone))
      return "Phone number must be a valid 10-digit number.";
    if (!province) return "Please select a province.";
    if (!district) return "Please select a district.";
    if (!city) return "Please select a city.";
    if (!address.trim()) return "Address cannot be empty.";
    return null; // All validations passed
  };

  const handleEditAddress = async () => {
    if (isEditing) {
      const validationError = validateInputs();
      if (validationError) {
        setError(validationError);
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          await updateDoc(doc(db, "users", userId), {
            phone,
            province,
            district,
            city,
            address,
          });
          Alert.alert("Success", "Address updated successfully!");
          setIsEditing(false);
        } catch (error) {
          console.error("Error updating address:", error);
          Alert.alert("Error", "Failed to update address. Please try again.");
        }
      }
    }
    setIsEditing(!isEditing);
  };

  const updateTotalPrice = (items: any[]) => {
    const price = items.reduce(
      (acc, item) => acc + (item.price || 0) * item.quantity,
      0
    );
    setTotalPrice(price);
  };

  const OrderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      <View style={styles.summaryRow}>
        <Text>Items Total ({cartItems.length} Items)</Text>
        <Text>Rs. {totalPrice}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.totalText}>Total:</Text>
        <Text style={styles.totalAmount}>Rs. {totalPrice}</Text>
      </View>
      <Text style={styles.taxInfo}>All taxes included</Text>
    </View>
  );

  const ProductItem = ({ item }: { item: any }) => (
    <View style={styles.productContainer}>
      <Image source={{ uri: item.image_urls[0] }} style={styles.productImage} />
      <View style={styles.productDescription}>
        <Text style={styles.productTitle}>{item.product_name}</Text>
        <Text style={styles.productPrice}>Rs. {item.price}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <Text>Qty: {item.quantity}</Text>
      </View>
    </View>
  );
  const handleCashOnDelivery = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const orderData = {
      userId,
      userName: userData?.name || "", // Default to empty string if userData is null
      phone: userData?.phone || "",
      province: province || "",
      district: district || "",
      city: city || "",
      address: address || "",
      items: cartItems.map((item) => ({
        productImage: item.image_urls[0],
        productTitle: item.product_name,
        price: item.price,
        quantity: item.quantity,
        totalItemPrice: item.price * item.quantity,
      })), // Include total price per item
      totalPrice,
      orderDate: Timestamp.now(),
      paymentStatus: "Cash On Delivery",
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const cartItemRef = doc(db, "cart", item.cartId);
        batch.delete(cartItemRef);
      });
      await batch.commit();
      setCartItems([]);
      setTotalPrice(0);

      Alert.alert("Success", "Order placed successfully!", [
        {
          text: "OK",
          onPress: () => navigation.replace("orders"), // Navigate to Orders page
        },
      ]);
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    }
  };

  const districtOptions = province
    ? Object.keys(provinces[province].districts)
    : [];
  const cityOptions =
    district && province ? provinces[province].districts[district] : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.addressContainer}>
          <Text style={styles.title}>Shipping Address</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.addressForm}>
            <Text style={styles.label}>Phone:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.text}>{phone}</Text>
            )}

            <Text style={styles.label}>Province:</Text>
            {isEditing ? (
              <Picker
                selectedValue={province}
                onValueChange={(itemValue) => {
                  setProvince(itemValue);
                  setDistrict(""); // Reset district and city when province changes
                  setCity("");
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Province" value="" />
                <Picker.Item label="Province 1" value="province1" />
                <Picker.Item label="Province 2" value="province2" />
              </Picker>
            ) : (
              <Text style={styles.text}>{province}</Text>
            )}

            <Text style={styles.label}>District:</Text>
            {isEditing ? (
              <Picker
                selectedValue={district}
                onValueChange={(itemValue) => {
                  setDistrict(itemValue);
                  setCity(""); // Reset city when district changes
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select District" value="" />
                {districtOptions.map((dist) => (
                  <Picker.Item key={dist} label={dist} value={dist} />
                ))}
              </Picker>
            ) : (
              <Text style={styles.text}>{district}</Text>
            )}

            <Text style={styles.label}>City:</Text>
            {isEditing ? (
              <Picker
                selectedValue={city}
                onValueChange={(itemValue) => setCity(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select City" value="" />
                {cityOptions.map((cityName) => (
                  <Picker.Item
                    key={cityName}
                    label={cityName}
                    value={cityName}
                  />
                ))}
              </Picker>
            ) : (
              <Text style={styles.text}>{city}</Text>
            )}

            <Text style={styles.label}>Address:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            ) : (
              <Text style={styles.text}>{address}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleEditAddress}>
            <Text style={styles.buttonText}>
              {isEditing ? "Save" : "Edit Address"}
            </Text>
          </TouchableOpacity>
        </View>
        <OrderSummary />
        {cartItems.map((item) => (
          <ProductItem key={item.cartId} item={item} />
        ))}

        <View style={styles.paymentOptionsContainer}>
          <TouchableOpacity onPress={handleCashOnDelivery}>
            <Image
              source={require("../../assets/images/c.png")}
              style={styles.paymentSticker}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require("../../assets/images/p.png")}
              style={styles.paymentSticker}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    padding: 16,
  },
  addressContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4b0082",
  },
  addressForm: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: "#555",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 25,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  paymentOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: -10,
    padding: 10,
  },
  paymentSticker: {
    width: 200, // Adjust the size as needed
    height: 200, // Adjust the size as needed
    resizeMode: "contain", // Ensures the image maintains its aspect ratio
  },

  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#3b5998",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 14,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
  },
  taxInfo: {
    marginTop: 10,
    fontSize: 12,
    color: "#7f8c8d",
  },
  productContainer: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
  },
  productDescription: {
    flex: 1,
    justifyContent: "center",
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    color: "#e67e22",
    marginVertical: 5,
  },
  quantityContainer: {
    marginTop: 10,
    fontSize: 14,
    color: "#7f8c8d",
  },
  addressTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default PaymentPage;
