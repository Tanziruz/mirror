"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { onAuthStateChange, getSession, recoverSessionFromUrlHash } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, check if there's an existing session (from localStorage after OAuth)
    const initializeSession = async () => {
      const recovered = await recoverSessionFromUrlHash();
      if (recovered.error) {
        console.error("OAuth session recovery failed:", recovered.error);
      }

      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        setSession(session);

        const path = window.location.pathname;
        const shouldRedirectToDashboard = path === "/" || path === "/login" || path === "/signup";
        if (shouldRedirectToDashboard) {
          window.location.replace("/dashboard");
          return;
        }
      }
      setLoading(false);
    };

    initializeSession();

    // Then listen for auth state changes
    const { data } = onAuthStateChange((user, session) => {
      setUser(user);
      setSession(session);
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user && !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
