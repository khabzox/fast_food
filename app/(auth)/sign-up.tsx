import { router } from 'expo-router'

import { View, Text, Button } from 'react-native'

export default function SignUp() {
  return (
    <View>
      <Text>SignUp</Text>
      <Button title="Sign In" onPress={() => router.push("/sign-in")} />
    </View>
  )
}