"use client";

import React, { useEffect } from "react"; // Add useEffect
import { SessionProvider, useSession } from "next-auth/react"; // Add useSession
import ModalProvider from "@/providers/modal-provider";
import ToastProvider from "@/providers/toast-provider";
// import { useUserProfileStore } from "@/hooks/use-user-profile"; // Removed Zustand import

interface ClientProvidersProps {
  children: React.ReactNode;
}

// Component to sync next-auth session tokens to localStorage
const SessionTokenSync = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      // Ensure tokens exist on the session object (types should include them)
      const accessToken = session?.accessToken;
      const refreshToken = session?.refreshToken;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        console.log("accessToken synced to localStorage."); // Optional: for debugging
      } else {
        localStorage.removeItem("accessToken"); // Remove if not present in session
        console.log("accessToken removed from localStorage (not in session).");
      }

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        console.log("refreshToken synced to localStorage."); // Optional: for debugging
      } else {
        localStorage.removeItem("refreshToken"); // Remove if not present in session
        console.log("refreshToken removed from localStorage (not in session).");
      }
    } else if (status === "unauthenticated") {
      // Clear tokens on logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      console.log("Tokens removed from localStorage (unauthenticated).");
    }
    // Depend on status and the session object itself (or specific token properties if preferred)
  }, [status, session]);

  return null; // This component doesn't render anything visible
};

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      {/* No need for InitializeUserProfile wrapper anymore */}
      <ModalProvider />
      <ToastProvider />
      {/* useCart hook might need its provider here if not handled by ToastProvider */}
      <SessionTokenSync /> {/* Add the sync component here */}
      {children}
    </SessionProvider>
  );
}
