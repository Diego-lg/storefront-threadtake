"use client";

import React, { useState, ChangeEvent } from "react"; // Added ChangeEvent
import { Button } from "@/components/ui/button"; // Corrected to named import
import { Input } from "@/components/ui/input"; // Assuming Shadcn Input
import { Label } from "@/components/ui/label"; // Assuming Shadcn Label
import { toast } from "react-hot-toast"; // Assuming react-hot-toast is used

export const PasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      // Example validation
      setError("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    toast.loading("Updating password...");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/password`;
      const response = await fetch(apiUrl, {
        // Target the backend API route
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "include", // <<< Add this line
      });

      toast.dismiss(); // Dismiss loading toast

      if (!response.ok) {
        // Try to get error message from backend response body
        let errorMessage = "Failed to update password.";
        try {
          const errorData = await response.json(); // Assuming backend sends JSON error
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        // Use the specific error message from backend if available
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage); // Throw to prevent success toast
      }

      toast.success("Password updated successfully!");
      // Clear fields after success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null); // Clear any previous errors on success
    } catch (err: unknown) {
      // Use unknown instead of any
      console.error("Failed to update password:", err);
      // Error might have already been set and toasted if response.ok was false
      if (!error) {
        // Only set/toast if not already handled by !response.ok block
        let message = "An unexpected error occurred.";
        if (err instanceof Error) {
          message = err.message; // Use Error message if available
        }
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setCurrentPassword(e.target.value)
          }
          disabled={isLoading}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewPassword(e.target.value)
          }
          disabled={isLoading}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setConfirmPassword(e.target.value)
          }
          disabled={isLoading}
          required
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
};
