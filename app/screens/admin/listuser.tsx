import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { db } from "../../firebaseConfig";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const Listuser = ({ navigation }: { navigation: any }) => {
  const [users, setUsers] = useState<any[]>([]); // Array to store users
  const [loading, setLoading] = useState(true); // Loading state

  // Function to fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(); // Fetch users on component mount
  }, []);

  // Function to handle role change
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });
      Alert.alert("Success", "User role updated successfully!");
      // Refresh user list after role update
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      Alert.alert("Error", "Failed to update user role.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Lists</Text>
      <FlatList
        style={{ width: "100%" }}
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.userText}>Name: {item.name}</Text>
            <Text style={styles.userText}>Email: {item.email}</Text>
            <Text style={styles.userText}>Role: {item.role}</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonBlue]}
                onPress={() => handleChangeRole(item.id, "admin")}
              >
                <Text style={styles.buttonText}>Make Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonGray]}
                onPress={() => handleChangeRole(item.id, "user")}
              >
                <Text style={styles.buttonText}>Make User</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users found.</Text>
        )}
        refreshing={loading}
        onRefresh={fetchUsers}
      />
      <TouchableOpacity
        style={[styles.navigationButton, styles.buttonGreen]}
        onPress={() => navigation.navigate("AdminPanel")}
      >
        <Text style={styles.buttonText}>Go to Admin Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  userItem: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  userText: {
    fontSize: 18,
    color: "#555",
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonBlue: {
    backgroundColor: "skyblue",
  },
  buttonGray: {
    backgroundColor: "gray",
  },
  buttonGreen: {
    backgroundColor: "green",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
    color: "#555",
  },
  navigationButton: {
    width: "100%",
    alignItems: "center",
  },
});

export default Listuser;
