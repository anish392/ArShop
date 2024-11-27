import { initStripe } from "@stripe/stripe-react-native";

// Function to initialize Stripe with necessary configurations
export const initializeStripe = async () => {
  await initStripe({
    publishableKey:
      "pk_test_51Q2kqJGHUc3jXHqK9k33VzOZGHBCIaIego97FT0ZWs0kUmDjtHN7xvyY3koWoc7gA8E65jyfEoiIXtSZacOYZGFx00yp6UunYq",
    urlScheme: "myapp",
  });
};
