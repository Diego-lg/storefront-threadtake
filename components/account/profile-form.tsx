"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  FormEvent,
} from "react";
import { useSession } from "next-auth/react"; // Use 'update' from useSession hook, remove getSession import
import Image from "next/image"; // Import Next Image
import { Button } from "@/components/ui/button"; // Corrected to named import
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
// import { useUserProfileStore } from "@/hooks/use-user-profile"; // Removed Zustand import

export const ProfileForm = () => {
  const { data: session, update } = useSession(); // Keep update for name changes
  // const { imageUrl: storeImageUrl, setImageUrl: setUserProfileImageUrl } =
  //   useUserProfileStore(); // Removed Zustand usage
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState(""); // State for bio
  const [portfolioUrl, setPortfolioUrl] = useState(""); // State for portfolio URL
  // const [profileCardBackground, setProfileCardBackground] = useState(""); // Removed text state for background (Phase 2 Rev)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // For previewing selected image
  // const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // Remove local state, rely on store
  const [isUploading, setIsUploading] = useState(false); // For profile picture
  const [isUpdatingName, setIsUpdatingName] = useState(false); // For text fields
  const [isUploadingBackground, setIsUploadingBackground] = useState(false); // For background image
  const [isDeletingBackground, setIsDeletingBackground] = useState(false); // State for background deletion
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(
    null
  );
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<
    string | null
  >(null);
  const [justUploadedBackgroundUrl, setJustUploadedBackgroundUrl] = useState<
    string | null
  >(null); // Temp state for immediate UI update
  // Removed forceUpdate state
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for profile picture input
  const backgroundFileInputRef = useRef<HTMLInputElement>(null); // Ref for background image input (Phase 2 Rev)

  useEffect(() => {
    console.log("[ProfileForm useEffect] Running. Session:", session); // DEBUG LOG
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      // setCurrentImageUrl(session.user.image || null); // Remove: Rely on ClientProviders to sync store
      // Initialize bio, portfolioUrl, and background from session
      setBio(session.user.bio || ""); // Use direct access (type defined in next-auth.d.ts)
      setPortfolioUrl(session.user.portfolioUrl || ""); // Use direct access (type defined in next-auth.d.ts)
      // Removed profileCardBackground text state init (Phase 2 Rev)
      setImagePreview(null); // Clear preview on session change
      setImageFile(null); // Clear selected file
      // setJustUploadedBackgroundUrl(null); // Reset temp state when session changes - REMOVED to prevent race condition
    }
  }, [session]);

  // Add this new useEffect hook inside the ProfileForm component
  useEffect(() => {
    console.log(
      "[ProfileForm Session Monitor] profileCardBackground:",
      session?.user?.profileCardBackground
    );
  }, [session]); // Run whenever the session object changes

  // Handle file selection and preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        // Clear the input value if invalid file type
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null); // Clear preview if no file selected
    }
  };

  // Handle background image file selection and preview (Phase 2 Rev)
  const handleBackgroundImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file for the background.");
        if (backgroundFileInputRef.current) {
          backgroundFileInputRef.current.value = "";
        }
        return;
      }
      setBackgroundImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBackgroundImageFile(null);
      setBackgroundImagePreview(null);
    }
  };

  // Function to upload profile picture image
  const handleImageUpload = async () => {
    if (!imageFile) return; // Should not happen if button is enabled correctly

    setIsUploading(true);
    const uploadToastId = toast.loading("Uploading image...");

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/profile-picture`;
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include", // Send cookies
      });

      toast.dismiss(uploadToastId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to upload image");
      }

      const result = await response.json();
      toast.success("Image uploaded successfully!");

      // Update Zustand store with the new image URL
      // Update local state for the form's display immediately
      // setCurrentImageUrl(result.image); // Remove: Rely on session update via update()

      // Trigger session update to refresh the JWT with the new image URL
      // Pass the data received from the API directly to update()
      // This tells next-auth to merge this data into the client-side session
      const updatedSession = await update(result);
      console.log(
        "ProfileForm: Session updated via update(). Returned session:",
        JSON.stringify(updatedSession, null, 2) // Log full structure
      );
      console.log(
        "ProfileForm: Image URL in returned session:",
        updatedSession?.user?.image // Log specific field
      );

      // Session has been updated via update(). ClientProviders should now handle
      // syncing the Zustand store based on the refreshed session state.
      // We still update the local state for immediate UI feedback before session propagates.
      // setCurrentImageUrl(result.image); // Remove: Rely on session update via update()
      setImageFile(null); // Clear the selected file state
      setImagePreview(null); // Clear the preview
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input visually
      }
    } catch (error: unknown) {
      // Use unknown
      console.error("Failed to upload image:", error);
      let message = "Image upload failed. Please try again.";
      if (error instanceof Error) {
        message = error.message; // Use Error message if available
      }
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to upload background image (Phase 2 Rev)
  const handleBackgroundUpload = async () => {
    if (!backgroundImageFile) return;

    setIsUploadingBackground(true);
    const uploadToastId = toast.loading("Uploading background image...");

    const formData = new FormData();
    formData.append("file", backgroundImageFile);

    try {
      // *** IMPORTANT: Use the new dedicated endpoint ***
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/profile-card-background`;
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      toast.dismiss(uploadToastId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to upload background image");
      }

      const result = await response.json(); // Expecting { profileCardBackground: 'new_url' }
      console.log("[handleBackgroundUpload] Backend Result:", result); // DEBUG LOG
      toast.success("Background image uploaded successfully!");

      // Trigger session update to refresh the JWT with the new background URL
      // Set temp state *before* calling update to ensure immediate UI feedback
      setJustUploadedBackgroundUrl(result.profileCardBackground);
      console.log("[handleBackgroundUpload] Session BEFORE update():", session); // DEBUG LOG
      // Reinstate the update call, similar to handleImageUpload
      const updatedSessionData = await update({
        profileCardBackground: result.profileCardBackground,
      });
      console.log(
        "[handleBackgroundUpload] Session AFTER update():",
        updatedSessionData
      ); // DEBUG LOG

      // Clear local states AFTER session update is likely processed
      setBackgroundImageFile(null);
      setBackgroundImagePreview(null);
      setJustUploadedBackgroundUrl(null); // Clear the temporary URL state
      if (backgroundFileInputRef.current) {
        backgroundFileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      // Use unknown
      console.error("Failed to upload background image:", error);
      let message = "Background image upload failed. Please try again.";
      if (error instanceof Error) {
        message = error.message; // Use Error message if available
      }
      toast.error(message);
    } finally {
      setIsUploadingBackground(false);
    }
  };

  // Function to delete background image (New)
  const handleDeleteBackground = async () => {
    // Check if there's actually a background to delete based on session
    if (!session?.user?.profileCardBackground) {
      // Use direct access
      toast.error("No background image set to delete.");
      return;
    }

    setIsDeletingBackground(true);
    const deleteToastId = toast.loading("Deleting background image...");

    try {
      // Use the same endpoint as upload, but with DELETE method
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/profile-card-background`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include", // Send cookies for authentication
      });

      toast.dismiss(deleteToastId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete background image");
      }

      toast.success("Background image deleted successfully!");

      // Update session locally to remove the background URL
      await update({ profileCardBackground: null });

      // Clear any local preview/file state just in case
      setBackgroundImageFile(null);
      setBackgroundImagePreview(null);
      if (backgroundFileInputRef.current) {
        backgroundFileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      // Use unknown
      console.error("Failed to delete background image:", error);
      let message = "Background image deletion failed. Please try again.";
      if (error instanceof Error) {
        message = error.message; // Use Error message if available
      }
      toast.error(message);
    } finally {
      setIsDeletingBackground(false);
    }
  };

  // Function to update profile (name, bio, portfolioUrl)
  const handleProfileUpdate = async () => {
    // Check if name actually changed
    // Determine which fields have changed
    const changedFields: {
      name?: string;
      bio?: string;
      portfolioUrl?: string;
      // profileCardBackground?: string; // Removed background field (Phase 2 Rev)
    } = {};
    const currentName = session?.user?.name || "";
    const currentBio = session?.user?.bio || "";
    const currentPortfolioUrl = session?.user?.portfolioUrl || "";
    // Removed background check (Phase 2 Rev)

    if (name.trim() !== currentName) {
      changedFields.name = name.trim();
    }
    if (bio.trim() !== currentBio) {
      changedFields.bio = bio.trim();
    }
    if (portfolioUrl.trim() !== currentPortfolioUrl) {
      changedFields.portfolioUrl = portfolioUrl.trim();
    }
    // Removed background check (Phase 2 Rev)

    // If no fields changed, do nothing
    if (Object.keys(changedFields).length === 0) {
      toast("No profile changes detected.", { icon: "ℹ️" });
      return;
    }

    setIsUpdatingName(true);
    const profileToastId = toast.loading("Updating profile...");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/account/profile`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changedFields), // Send only changed fields
        credentials: "include",
      });

      toast.dismiss(profileToastId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update profile");
      }

      // Update session locally with all changed fields
      await update(changedFields);

      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      // Use unknown
      console.error("Failed to update profile:", error); // Corrected log message
      let message = "Failed to update profile. Please try again.";
      if (error instanceof Error) {
        message = error.message; // Use Error message if available
      }
      toast.error(message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Combined form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prioritize image upload if a new file is selected
    if (imageFile) {
      await handleImageUpload();
    }
    // Then update the name if it has changed
    await handleProfileUpdate(); // Call updated handler
  };

  if (!session?.user) {
    return <p>Loading profile...</p>;
  }

  // Define combined loading state
  const isLoading =
    isUploading ||
    isUpdatingName ||
    isUploadingBackground ||
    isDeletingBackground; // Include delete state

  // Render the form
  console.log("[ProfileForm Render] Session object:", session); // DEBUG LOG
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Section */}
        <div>
          <Label>Profile Picture</Label>
          <div className="mt-2 flex items-center gap-x-4">
            {/* Enhanced Profile Picture Display */}
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600">
              <Image
                src={
                  imagePreview || // Show preview of selected file first
                  session?.user?.image || // Use image directly from session
                  "/assets/placeholder-avatar.jpg" // Fallback to placeholder
                }
                alt="Profile Picture"
                fill
                style={{ objectFit: "cover" }}
                sizes="80px" // Provide sizes hint for optimization
                priority={true} // Prioritize loading profile pic
                onError={(e) => {
                  // Handle broken image links by falling back to placeholder
                  e.currentTarget.src = "/assets/placeholder-avatar.jpg";
                }}
              />
            </div>
            {/* Hidden Actual File Input */}
            <Input
              id="profile-picture-input" // Changed id to avoid conflict if label used 'for'
              ref={fileInputRef} // Assign ref
              type="file"
              accept="image/*" // Accept only image files
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden" // Hide the default input
            />
            {/* Modern File Input Trigger Button */}
            <div className="flex flex-col items-start">
              <Button
                type="button" // Prevent form submission
                // variant="outline" // Removed unsupported prop
                // size="sm" // Removed unsupported prop
                onClick={() => fileInputRef.current?.click()} // Trigger hidden input
                disabled={isLoading}
              >
                Choose Picture
              </Button>
              {imageFile && (
                <span className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 truncate max-w-[200px]">
                  {imageFile.name}
                </span>
              )}
              {!imageFile && !imagePreview && (
                <span className="text-sm text-neutral-500 mt-1">
                  No file chosen
                </span>
              )}
              {imagePreview && !imageFile && (
                <span className="text-sm text-neutral-500 mt-1 italic">
                  Current picture
                </span>
              )}
            </div>
          </div>
          {/* Display upload button only if a new file is selected and not currently uploading */}
          {imageFile && !isUploading && (
            <Button
              type="button" // Important: type="button" to prevent form submission
              onClick={handleImageUpload}
              disabled={isUploading || isUpdatingName}
              // variant="outline" // Removed unsupported prop
              // size="sm" // Removed unsupported prop
              className="mt-2" // Keep custom margin
            >
              {isUploading ? "Uploading..." : "Upload New Picture"}
            </Button>
          )}
        </div>

        {/* Name Section */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            disabled={isLoading}
            required
            className="mt-1"
          />
        </div>

        {/* Email Section */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled={true}
            readOnly
            className="mt-1 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Email address cannot be changed.
          </p>
        </div>

        {/* Bio Section */}
        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setBio(e.target.value)
            }
            placeholder="Tell us a little about yourself..."
            disabled={isLoading}
            className="mt-1 w-full px-3 py-1.5 bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-ring placeholder-muted-foreground"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Optional short biography.
          </p>
        </div>

        {/* Portfolio URL Section */}
        <div>
          <Label htmlFor="portfolioUrl">Portfolio URL</Label>
          <Input
            id="portfolioUrl"
            type="url"
            value={portfolioUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPortfolioUrl(e.target.value)
            }
            placeholder="https://yourportfolio.com"
            disabled={isLoading}
            className="mt-1"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Optional link to your website or portfolio.
          </p>
        </div>

        {/* Profile Card Background Image Section (Phase 2 Rev) */}
        <div>
          <Label>Profile Card Background Image</Label>
          <div className="mt-2 flex items-center gap-x-4">
            {/* Background Image Display/Preview */}
            <div className="relative h-20 w-40 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600">
              <Image
                key={
                  justUploadedBackgroundUrl || // Prioritize temp state in key
                  backgroundImagePreview ||
                  session?.user?.profileCardBackground || // Use direct access
                  "default-background"
                } // Add key to force re-render
                src={
                  justUploadedBackgroundUrl || // Prioritize temp state for src
                  backgroundImagePreview || // Show preview of selected file first
                  session?.user?.profileCardBackground || // Use direct access
                  "/assets/background.png" // Fallback placeholder
                }
                alt="Profile Card Background"
                fill
                style={{ objectFit: "cover" }}
                sizes="160px"
                onError={(e) => {
                  e.currentTarget.src = "/assets/background.png";
                }}
              />
            </div>
            {/* Hidden Background File Input */}
            <Input
              id="background-image-input"
              ref={backgroundFileInputRef} // Use dedicated ref
              type="file"
              accept="image/*"
              onChange={(e) => handleBackgroundImageChange(e)} // Use dedicated handler
              disabled={isLoading || isUploadingBackground} // Disable during any upload/update
              className="hidden"
            />
            {/* Background File Input Trigger Button */}
            <div className="flex flex-col items-start space-y-2">
              {/* Added space-y-2 */}
              {/* Choose/Change Button */}
              <Button
                type="button"
                onClick={() => backgroundFileInputRef.current?.click()}
                disabled={isLoading} // Use combined loading state
              >
                {session?.user?.profileCardBackground || // Use direct access
                backgroundImagePreview // Check preview first
                  ? "Change Background"
                  : "Choose Background"}
              </Button>
              {/* Display selected file name */}
              {backgroundImageFile && (
                <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                  {backgroundImageFile.name}
                </span>
              )}
              {/* Upload Button - Appears only when a new file is selected */}
              {backgroundImageFile && !isUploadingBackground && (
                <Button
                  type="button"
                  onClick={handleBackgroundUpload}
                  disabled={isLoading} // Use combined loading state
                >
                  {isUploadingBackground
                    ? "Uploading..."
                    : "Upload New Background"}
                </Button>
              )}
              {/* Delete Button - Appears only if a background exists in session and no new file is selected */}
              {session?.user?.profileCardBackground && // Use direct access
                !backgroundImageFile && (
                  <Button
                    type="button"
                    // variant="destructive" // Removed unsupported prop
                    onClick={handleDeleteBackground}
                    disabled={isLoading} // Use combined loading state
                  >
                    {isDeletingBackground ? "Deleting..." : "Delete Background"}
                  </Button>
                )}
              {/* Status Text */}
              {!backgroundImageFile &&
                !backgroundImagePreview &&
                !justUploadedBackgroundUrl && // Check temp state
                !session?.user?.profileCardBackground && ( // Use direct access
                  <span className="text-sm text-neutral-500">
                    No background set.
                  </span>
                )}
              {!backgroundImageFile &&
                (justUploadedBackgroundUrl || // Check temp state OR session
                  session?.user?.profileCardBackground) && ( // Use direct access
                  <span className="text-sm text-neutral-500 italic">
                    Current background shown.
                  </span>
                )}
            </div>
          </div>
          {/* Background Upload Button */}
        </div>

        {/* Save Button - Now saves only name, bio, portfolioUrl */}
        <Button
          type="submit"
          disabled={
            isLoading || // Disable if uploading image or updating profile
            (name.trim() === (session?.user?.name || "") &&
              bio.trim() === (session?.user?.bio || "") && // Removed 'as any'
              portfolioUrl.trim() === (session?.user?.portfolioUrl || "")) // Removed 'as any' & Disable if no changes
          }
        >
          {isUpdatingName ? "Saving Profile..." : "Save Profile Changes"}
        </Button>
        <p className="text-xs text-neutral-500 mt-1">
          Upload a new picture using the file selector above. Name, Bio, and
          Portfolio URL changes are saved with this button. (Reverted Phase 2
          Rev)
        </p>
      </form>
    </>
  );
};
