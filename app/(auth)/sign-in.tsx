import { router } from "expo-router";

import { View, Text, Button } from "react-native";

export default function SignIn() {
  return (
    <View>
      <Text>SignIn</Text>
      <Button title="Sign Up" onPress={() => router.push("/sign-up")} />
    </View>
  );
}
