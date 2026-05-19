import React, { createContext, useContext, useState, useCallback } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("bib_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const signIn = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    const sess = { username: data.username, cargo: data.cargo, token: data.token };
    setSession(sess);
    localStorage.setItem("bib_session", JSON.stringify(sess));
    return sess;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem("bib_session");
  }, []);

  const isAdmin  = session?.cargo === "Admin";
  const isLogged = !!session;

  return (
    <AuthContext.Provider value={{ session, signIn, signOut, isAdmin, isLogged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
