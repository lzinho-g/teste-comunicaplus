import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { hashPassword } from "../utils/auth";

const AUTH_USER_KEY = "@comunicaplus/auth/user";
const AUTH_SESSION_KEY = "@comunicaplus/auth/session";
const AUTH_FIRST_LOGIN_KEY = "@comunicaplus/auth/firstLoginCompleted";
const LEGACY_AUTH_KEY = "@comunicaplus/auth";

export type AuthUserRecord = {
  name: string;
  cpf: string;
  phone: string;
  address: string;
  email: string;
  passwordHash: string;
  photoUri?: string | null;
};

async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthUser(user: AuthUserRecord): Promise<void> {
  await setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getAuthUser(): Promise<AuthUserRecord | null> {
  const stored = await getItem(AUTH_USER_KEY);

  if (stored) {
    try {
      return JSON.parse(stored) as AuthUserRecord;
    } catch {
      return null;
    }
  }

  const legacyStored = await AsyncStorage.getItem(LEGACY_AUTH_KEY);

  if (!legacyStored) {
    return null;
  }

  let parsed: (Partial<AuthUserRecord> & { password?: string }) | null = null;

  try {
    parsed = JSON.parse(legacyStored) as Partial<AuthUserRecord> & {
      password?: string;
    };
  } catch {
    await AsyncStorage.removeItem(LEGACY_AUTH_KEY);
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  let passwordHash = String(parsed.passwordHash ?? "");

  if (!passwordHash && parsed.password) {
    passwordHash = await hashPassword(parsed.password);
  }

  if (!passwordHash) {
    return null;
  }

  const migratedUser: AuthUserRecord = {
    name: String(parsed.name ?? ""),
    cpf: String(parsed.cpf ?? ""),
    phone: String(parsed.phone ?? ""),
    address: String(parsed.address ?? ""),
    email: String(parsed.email ?? ""),
    passwordHash,
    photoUri: parsed.photoUri ?? null,
  };

  await saveAuthUser(migratedUser);
  await AsyncStorage.removeItem(LEGACY_AUTH_KEY);

  return migratedUser;
}

export async function removeAuthUser(): Promise<void> {
  await removeItem(AUTH_USER_KEY);
}

export async function saveAuthSession(isAuthenticated: boolean): Promise<void> {
  await setItem(AUTH_SESSION_KEY, JSON.stringify(isAuthenticated));
}

export async function getAuthSession(): Promise<boolean> {
  const stored = await getItem(AUTH_SESSION_KEY);

  if (!stored) {
    return false;
  }

  try {
    return Boolean(JSON.parse(stored));
  } catch {
    return false;
  }
}

export async function removeAuthSession(): Promise<void> {
  await removeItem(AUTH_SESSION_KEY);
}

export async function saveFirstLoginCompleted(completed: boolean): Promise<void> {
  await setItem(AUTH_FIRST_LOGIN_KEY, JSON.stringify(completed));
}

export async function getFirstLoginCompleted(): Promise<boolean> {
  const stored = await getItem(AUTH_FIRST_LOGIN_KEY);

  if (!stored) {
    return false;
  }

  try {
    return Boolean(JSON.parse(stored));
  } catch {
    return false;
  }
}

export async function removeFirstLoginCompleted(): Promise<void> {
  await removeItem(AUTH_FIRST_LOGIN_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([
    removeAuthUser(),
    removeAuthSession(),
    removeFirstLoginCompleted(),
  ]);
}
