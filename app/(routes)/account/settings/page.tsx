import React from "react";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { PreferencesForm } from "@/components/account/preferences-form";
import Container from "@/components/ui/container"; // Use container for consistent layout

// Main Account Settings page component
const AccountSettingsPage = () => {
  return (
    <Container>
      {" "}
      {/* Wrap content in Container */}
      <div className="py-8 sm:py-12 bg-background text-foreground">
        {" "}
        {/* Added padding */}
        <h1 className="text-3xl font-bold mb-8 sm:mb-10 text-center sm:text-left">
          {" "}
          {/* Adjusted heading */}
          Account Settings
        </h1>
        <div className="space-y-10 sm:space-y-12">
          {" "}
          {/* Increased spacing */}
          {/* Profile Information Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Profile Information
            </h2>
            <div className="max-w-xl">
              {" "}
              {/* Constrain form width */}
              <ProfileForm />
            </div>
          </section>
          {/* Password Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Password
            </h2>
            <div className="max-w-xl">
              {" "}
              {/* Constrain form width */}
              <PasswordForm />
            </div>
          </section>
          {/* Preferences Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Preferences
            </h2>
            <div className="max-w-xl">
              {" "}
              {/* Constrain form width */}
              <PreferencesForm />
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
};

export default AccountSettingsPage;
