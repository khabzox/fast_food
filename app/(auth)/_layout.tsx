import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "react-native";

export default function _layout() {
  return (
    <SafeAreaView>
      <Text>Auth Layout</Text>
      <Slot />
    </SafeAreaView>
  );
}
