// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyBKUggasf-aYjtG-6oM2OPb8VsIV9yB4ww",
  authDomain: "arshop-a835f.firebaseapp.com",
  projectId: "arshop-a835f",
  storageBucket: "arshop-a835f.appspot.com",
  messagingSenderId: "239298314407",
  appId: "1:239298314407:android:b9ebb8c4ec6d842f6fdb82",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });
