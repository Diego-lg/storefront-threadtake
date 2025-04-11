"use client"; // This component needs client-side interactivity

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"; // Corrected to named import
// Input and Label components not found, using standard HTML elements for now.
// You can add shadcn/ui Input and Label later via CLI if needed.
import toast from "react-hot-toast";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get callback URL from query params or default to home
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually after checking result
        email: email,
        password: password,
        // callbackUrl: callbackUrl // Optional: Pass callbackUrl if needed by backend (usually not for credentials)
      });

      setIsLoading(false);

      if (result?.error) {
        // Error messages returned from the authorize function or NextAuth itself
        console.error("Login Error:", result.error);
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password."
            : result.error
        );
        toast.error(
          result.error === "CredentialsSignin"
            ? "Invalid email or password."
            : result.error
        );
      } else if (result?.ok) {
        // Login successful
        toast.success("Logged in successfully!");
        router.push(callbackUrl); // Redirect to the intended page or home
        router.refresh(); // Refresh server components
      } else {
        // Handle unexpected cases where result is ok=false but no specific error
        setError("An unknown login error occurred.");
        toast.error("An unknown login error occurred.");
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Login Submit Catch:", err);
      setError("An unexpected error occurred during login.");
      toast.error("An unexpected error occurred during login.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-center text-sm font-medium text-red-600 bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-sm font-light uppercase tracking-widest text-white"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Basic styling
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-light uppercase tracking-widest text-white"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Basic styling
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
      {/* Optional: Add link to registration page */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Register here
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
