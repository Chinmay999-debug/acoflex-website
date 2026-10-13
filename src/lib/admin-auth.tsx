import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check whether the authenticated user has an active admin record
  const checkAdminStatus = async (currentUser: User | null): Promise<boolean> => {
    if (!currentUser || !supabase) {
      setIsAdmin(false);
      return false;
    }

    try {
      // 1. First attempt the secure security definer RPC
      const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
      if (!rpcError && typeof rpcIsAdmin === "boolean") {
        setIsAdmin(rpcIsAdmin);
        return rpcIsAdmin;
      }

      // 2. Direct fallback check on admin_users table under current user RLS
      const { data: adminRows, error: tableError } = await supabase
        .from("admin_users")
        .select("id, role")
        .eq("id", currentUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!tableError && adminRows) {
        setIsAdmin(true);
        return true;
      }

      setIsAdmin(false);
      return false;
    } catch (err) {
      console.error("Failed to verify admin status:", err);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Load initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) {
          setError(sessionError.message);
          setIsLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await checkAdminStatus(initialSession.user);
        } else {
          setIsAdmin(false);
        }
        if (isMounted) setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error retrieving initial session:", err);
        setIsLoading(false);
      });

    // Listen to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === "SIGNED_OUT" || !currentSession?.user) {
        setIsAdmin(false);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setIsLoading(true);
        await checkAdminStatus(currentSession.user);
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is not configured." };
    }

    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return { success: false, error: signInError.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: "No user returned from login." };
      }

      const adminVerified = await checkAdminStatus(data.user);
      setIsLoading(false);

      if (!adminVerified) {
        // Sign out user immediately if they are not in admin_users
        await supabase.auth.signOut();
        const msg = "Access denied: Account is not authorized as an Acoflex administrator.";
        setError(msg);
        return { success: false, error: msg };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "An unexpected error occurred during sign in.";
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsLoading(false);
      setError(null);
    }
  };

  const refreshAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    return await checkAdminStatus(user);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        error,
        signIn,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
