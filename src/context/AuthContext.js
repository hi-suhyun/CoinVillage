import { createContext, useContext, useEffect, useState } from "react";
import * as Crypto from "expo-crypto";
import { getJSON, setJSON, remove } from "../store/storage";
import { verify } from "../utils/auth";

const AuthCtx = createContext(null);
const AUTH_KEY = "auth", SESSION_KEY = "session";

async function hash(pw) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(pw));
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await getJSON(AUTH_KEY);
      const s = await getJSON(SESSION_KEY);
      setAccount(a);
      setLoggedIn(Boolean(a && s && s.loggedIn));
      setReady(true);
    })();
  }, []);

  async function register({ email, password, pin }) {
    const passwordHash = await hash(password);
    const pinHash = await hash(pin);
    const acc = { email: email.trim().toLowerCase(), passwordHash, pinHash, createdAt: Date.now() };
    await setJSON(AUTH_KEY, acc);
    await setJSON(SESSION_KEY, { loggedIn: true });
    setAccount(acc); setLoggedIn(true);
    return acc;
  }

  async function login({ email, password }) {
    const a = account || (await getJSON(AUTH_KEY));
    if (!a) return { ok: false, error: "가입 정보가 없습니다" };
    if (String(email).trim().toLowerCase() !== a.email) return { ok: false, error: "이메일 또는 비밀번호가 일치하지 않습니다" };
    const h = await hash(password);
    if (!verify(h, a.passwordHash)) return { ok: false, error: "이메일 또는 비밀번호가 일치하지 않습니다" };
    await setJSON(SESSION_KEY, { loggedIn: true });
    setAccount(a); setLoggedIn(true);
    return { ok: true };
  }

  async function logout() {
    await remove(SESSION_KEY);
    setLoggedIn(false);
  }

  async function verifyPin(pin) {
    const a = account || (await getJSON(AUTH_KEY));
    if (!a) return false;
    return verify(await hash(pin), a.pinHash);
  }

  return (
    <AuthCtx.Provider value={{ ready, hasAccount: Boolean(account), loggedIn, account, register, login, logout, verifyPin }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
