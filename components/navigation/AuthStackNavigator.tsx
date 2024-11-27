import React from "react";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import LoginScreen from "../../app/screens/LoginScreen";
import SignupScreen from "../../app/screens/SignupScreen";
import UserHome from "../../app/screens/UserHome";
import AdminPanel from "../../app/screens/admin/AdminPanel";
import Listuser from "../../app/screens/admin/listuser";
import Insertproduct from "../../app/screens/admin/insertproduct";
import Userpage from "../../app/screens/userpage";
import Viewproducts from "../../app/screens/admin/viewproducts";
import Editproduct from "../../app/screens/admin/editproduct";
import Viewinar from "../../app/screens/viewinar";
import Editusername from "@/app/screens/editusername";
import Viewdetails from "../../app/screens/viewdetails";
import About from "../../app/screens/about";
import Cart from "../../app/screens/cart/cart";
import Payment from "@/app/screens/payment";
import Orders from "../../app/screens/orders";
import Vieworders from "../../app/screens/admin/vieworders";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  UserHome: undefined;
  AdminPanel: undefined;
  listuser: undefined;
  insertproduct: undefined;
  userpage: undefined;
  viewproducts: undefined;
  editproduct: undefined;
  cart: undefined;
  about: undefined;
  orders: undefined;
  payment: undefined;
  vieworders: undefined;
  index: undefined;
  viewinar: { product: { image_urls: string[]; product_name: string } };
  editusername: undefined;
  viewdetails: {
    product: {
      image_urls: string[];
      product_name: string;
      price: number;
      description: string;
      contact_no: number;
      stock: number;
      id: string;
    };
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthStackNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Signup"
      component={SignupScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="UserHome"
      component={UserHome}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AdminPanel"
      component={AdminPanel}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="listuser"
      component={Listuser}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="insertproduct"
      component={Insertproduct}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="userpage"
      component={Userpage}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="viewproducts"
      component={Viewproducts}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="editproduct"
      component={Editproduct}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="viewinar"
      component={Viewinar}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="viewdetails"
      component={Viewdetails}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="editusername"
      component={Editusername}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="orders"
      component={Orders}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="vieworders"
      component={Vieworders}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="about"
      component={About}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="payment"
      component={Payment}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="cart"
      component={Cart}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default AuthStackNavigator;
