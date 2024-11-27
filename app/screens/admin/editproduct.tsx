import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";

const Editproduct: React.FC<{ route: any; navigation: any }> = React.memo(
  ({ route, navigation }) => {
    const { product } = route.params;

    const [productName, setProductName] = useState(product.product_name);
    const [price, setPrice] = useState(product.price.toString());
    const [description, setDescription] = useState(product.description);
    const [contactNo, setContactNo] = useState(
      product.contact_no?.toString() || ""
    );
    const [stock, setStock] = useState(product.stock?.toString() || "");

    const [selectedFiles, setSelectedFiles] = useState<string[]>(
      product.image_urls || []
    );
    const [errors, setErrors] = useState({
      productName: "",
      price: "",
      description: "",
      contactNo: "",
      selectedFiles: "",
      stock: "",
    });

    const pickFilesAsync = useCallback(async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*"],
          multiple: true, // Allow multiple image selection
        });

        if (!result.canceled) {
          const uris = result.assets.map((asset) => asset.uri);
          setSelectedFiles(uris); // Replace existing images with new ones
        } else {
          alert("You did not select any files.");
        }
      } catch (error) {
        console.error("Error picking files:", error);
        Alert.alert("Error picking files. Please try again.");
      }
    }, []);

    const uploadFilesAsync = useCallback(
      async (uris: string[], productId: string) => {
        const storage = getStorage();
        const fileUrls: string[] = [];

        for (const uri of uris) {
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileRef = ref(
            storage,
            `product_images/${productId}/${Date.now()}`
          );
          await uploadBytes(fileRef, blob);
          const downloadURL = await getDownloadURL(fileRef);
          fileUrls.push(downloadURL);
        }

        return fileUrls;
      },
      []
    );

    const handleUpdateProduct = useCallback(async () => {
      // Basic form validation
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

      setErrors(newErrors);

      if (!isValid) {
        return;
      }

      try {
        // Update product data
        await setDoc(
          doc(db, "products", product.id),
          {
            product_name: productName,
            price: parseFloat(price),
            description: description,
            contact_no: parseFloat(contactNo), // Convert back to number
            stock: parseInt(stock),
          },
          { merge: true }
        );

        // Upload files and update Firestore with new URLs
        if (selectedFiles.length > 0) {
          const fileUrls = await uploadFilesAsync(selectedFiles, product.id);
          await setDoc(
            doc(db, "products", product.id),
            { image_urls: fileUrls },
            { merge: true }
          );
        }

        console.log("Product updated with ID: ", product.id);
        Alert.alert("Product updated successfully!");
        navigation.goBack(); // Navigate back to previous screen after successful update
      } catch (error) {
        console.error("Error updating product: ", error);
        Alert.alert("Failed to update product. Please try again.");
      }
    }, [
      productName,
      price,
      description,
      contactNo,
      stock,
      selectedFiles,
      product,
      uploadFilesAsync,
    ]);

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Product</Text>
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
          <Text style={styles.buttonText}>Change Files</Text>
        </TouchableOpacity>
        {errors.selectedFiles ? (
          <Text style={styles.errorText}>{errors.selectedFiles}</Text>
        ) : null}
        <View style={styles.imagesContainer}>
          {selectedFiles.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.button, styles.updateButton]}
          onPress={handleUpdateProduct}
        >
          <Text style={styles.buttonText}>Update Product</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
);

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
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 5,
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 16,
  },
  updateButton: {
    backgroundColor: "#ffc107",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Editproduct;
