import { Redirect, Slot } from "expo-router";

export default function _Layout() {
    const isAuthencitated = false;

    if(!isAuthencitated) return <Redirect href="/sign-in" />

  return <Slot />;
}
