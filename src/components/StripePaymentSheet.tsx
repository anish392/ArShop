import React, { useState } from "react";
import { View, Button, Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { initializeStripe } from "../services/stripeService";

interface StripePaymentProps {
  amount: number; // Amount in cents
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // Function to initialize and present the payment sheet
  const handlePayment = async () => {
    setLoading(true);
    try {
      // Fetch payment intent from your server
      const response = await fetch(
        "your_server_endpoint/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        }
      );
      const { paymentIntent, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Your Company Name",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
          Alert.alert("Error", paymentError.message);
          onPaymentFailed();
        } else {
          Alert.alert("Success", "Payment successful");
          onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error("Error during payment process:", error);
      Alert.alert("Error", "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? "Processing..." : "Pay with Stripe"}
        onPress={handlePayment}
        disabled={loading}
      />
    </View>
  );
};

export default StripePayment;
