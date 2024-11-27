import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

const InsertProductScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [stock, setStock] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    productName: "",
    price: "",
    description: "",
    contactNo: "",
    selectedFiles: "",
    stock: "",
  });

  const [loading, setLoading] = useState(false); // Add loading state
  const pickFilesAsync = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/octet-stream"], // Modify types as needed
        multiple: true,
      });

      if (!result.canceled) {
        const uris = result.assets.map((asset) => asset.uri);
        setSelectedFiles(uris);
      } else {
        Alert.alert("You did not select any file.");
      }
    } catch (error) {
      console.error("Error picking files:", error);
      Alert.alert("Error picking files. Please try again.");
    }
  };

  const uploadFilesAsync = async (uris: string[], productId: string) => {
    try {
      const storage = getStorage();
      const uploadPromises = uris.map(async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const fileName = fileInfo.uri.split("/").pop();
        const fileRef = ref(storage, `product_images/${productId}/${fileName}`);
        await uploadBytes(fileRef, blob);
        return getDownloadURL(fileRef);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading files:", error);
      Alert.alert("Error uploading files. Please try again.");
      return [];
    }
  };

  const handleAddProduct = async () => {
    let isValid = true;
    const newErrors = {
      productName: "",
      price: "",
      description: "",
      contactNo: "",
      selectedFiles: "",
      stock: "",
    };

    if (!productName.trim()) {
      newErrors.productName = "Product Name is required";
      isValid = false;
    }

    if (!price.trim()) {
      newErrors.price = "Price is required";
      isValid = false;
    } else if (!/^\d+$/.test(price)) {
      newErrors.price = "Price must be a number";
      isValid = false;
    }

    if (!stock.trim()) {
      newErrors.stock = "Stock is required";
      isValid = false;
    } else if (!/^\d+$/.test(stock)) {
      newErrors.stock = "Stock must be a number";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    if (!contactNo.trim()) {
      newErrors.contactNo = "Contact Number is required";
      isValid = false;
    } else if (!/^\d+$/.test(contactNo)) {
      newErrors.contactNo = "Contact Number must contain only digits";
      isValid = false;
    }

    if (selectedFiles.length === 0) {
      newErrors.selectedFiles = "At least one file is required";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    try {
      setLoading(true); // Set loading state
      // Create product document in Firestore
      const docRef = await addDoc(collection(db, "products"), {
        product_name: productName,
        price: parseFloat(price),
        description,
        contact_no: parseFloat(contactNo),
        stock: parseFloat(stock),
        image_urls: [],
        timestamp: serverTimestamp(),
      });

      // Update the product document with product_id
      await setDoc(
        doc(db, "products", docRef.id),
        { product_id: docRef.id },
        { merge: true }
      );

      // Upload files and get URLs
      if (selectedFiles.length > 0) {
        const fileUrls = await uploadFilesAsync(selectedFiles, docRef.id);
        // Update the product document with image URLs
        await setDoc(
          doc(db, "products", docRef.id),
          { image_urls: fileUrls },
          { merge: true }
        );
      }

      Alert.alert("Product added successfully!");
      // Reset form fields
      setProductName("");
      setPrice("");
      setDescription("");
      setContactNo("");
      setStock("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error adding product: ", error);
      Alert.alert("Failed to add product. Please try again.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Product</Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
      />
      {errors.productName ? (
        <Text style={styles.errorText}>{errors.productName}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      {errors.price ? (
        <Text style={styles.errorText}>{errors.price}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={10}
      />
      {errors.description ? (
        <Text style={styles.errorText}>{errors.description}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Contact No."
        value={contactNo}
        onChangeText={setContactNo}
        keyboardType="phone-pad"
      />
      {errors.contactNo ? (
        <Text style={styles.errorText}>{errors.contactNo}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Stock"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />
      {errors.stock ? (
        <Text style={styles.errorText}>{errors.stock}</Text>
      ) : null}
      <TouchableOpacity style={styles.imagePicker} onPress={pickFilesAsync}>
        <Text style={styles.buttonText}>
          {loading ? "Uploading..." : "Upload Files"}
        </Text>
      </TouchableOpacity>
      {errors.selectedFiles ? (
        <Text style={styles.errorText}>{errors.selectedFiles}</Text>
      ) : null}
      {selectedFiles.map((file, index) => (
        <Image key={index} source={{ uri: file }} style={styles.image} />
      ))}
      <TouchableOpacity
        style={[styles.button, styles.addButton]}
        onPress={handleAddProduct}
        disabled={loading} // Disable button during upload
      >
        {loading ? (
          <ActivityIndicator color="#fff" /> // Show spinner while loading
        ) : (
          <Text style={styles.buttonText}>Add Product</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => navigation.navigate("AdminPanel")}
      >
        <Text style={styles.buttonText}>Back to Admin Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    paddingLeft: 10,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    marginBottom: 8,
    marginLeft: 8,
  },
  imagePicker: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: "#28a745",
  },
  backButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
});

export default InsertProductScreen;
