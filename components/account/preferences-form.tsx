"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button"; // Corrected to named import
import { toast } from "react-hot-toast";

// Example: Define a type for preferences
interface UserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
}

export const PreferencesForm = () => {
  // In a real app, fetch initial preferences from user data/API
  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: false, // Default to light mode
    emailNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Example: Load preferences (e.g., dark mode from localStorage or API)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("theme") === "dark";
    // Fetch other preferences if needed
    setPreferences((prev) => ({ ...prev, darkMode: savedDarkMode }));

    // Apply dark mode class on initial load
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handlePreferenceChange = (
    key: keyof UserPreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));

    // Special handling for dark mode toggle
    if (key === "darkMode") {
      if (value) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading("Saving preferences...");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/preferences`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences), // Send the whole preferences object
        credentials: "include", // <<< Add this line
      });

      toast.dismiss(); // Dismiss loading toast

      if (!response.ok) {
        let errorMessage = "Failed to save preferences.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Optionally update local state based on response if backend modifies data
      // const updatedPrefs = await response.json();
      // setPreferences(updatedPrefs);

      toast.success("Preferences saved successfully!");
    } catch (error: unknown) {
      // Use unknown instead of any
      console.error("Failed to save preferences:", error);
      // Avoid double-toasting if error came from !response.ok
      let message = "An unexpected error occurred.";
      if (error instanceof Error) {
        message = error.message; // Use Error message if available
      }

      if (
        !(
          error instanceof Error &&
          error.message.startsWith("Failed to save preferences")
        )
      ) {
        toast.error(message); // Use the extracted message
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="darkMode" className="text-base">
            Dark Mode
          </Label>
          <p className="text-sm text-muted-foreground">
            Enable dark theme across the site.
          </p>
        </div>
        <Switch
          id="darkMode"
          checked={preferences.darkMode}
          onCheckedChange={(checked) =>
            handlePreferenceChange("darkMode", checked)
          }
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="emailNotifications" className="text-base">
            Email Notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Receive emails about orders and promotions.
          </p>
        </div>
        <Switch
          id="emailNotifications"
          checked={preferences.emailNotifications}
          onCheckedChange={(checked) =>
            handlePreferenceChange("emailNotifications", checked)
          }
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  );
};
