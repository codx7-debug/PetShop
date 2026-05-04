import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = ["token", "user"] as const;

/** Clears sign-in session so the user must authenticate again. */
export async function clearUserSession(): Promise<void> {
  await AsyncStorage.multiRemove([...KEYS]);
}
