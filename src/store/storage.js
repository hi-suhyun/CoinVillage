import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getJSON(key) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function setJSON(key, obj) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(obj));
  } catch {}
}

export async function remove(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}
