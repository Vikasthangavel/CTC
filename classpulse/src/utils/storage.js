import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback if both AsyncStorage native module and localStorage fail
const memoryStorage = new Map();

const safeStorage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) return item;
      }
      return await AsyncStorage.getItem(key);
    } catch (err) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          return window.localStorage.getItem(key);
        } catch (_) {}
      }
      return memoryStorage.get(key) || null;
    }
  },

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(key, value);
        } catch (_) {}
      }
      memoryStorage.set(key, value);
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
    } catch (err) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(key);
        } catch (_) {}
      }
      memoryStorage.delete(key);
    }
  },

  async clear() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      await AsyncStorage.clear();
    } catch (err) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.clear();
        } catch (_) {}
      }
      memoryStorage.clear();
    }
  },
};

export default safeStorage;
