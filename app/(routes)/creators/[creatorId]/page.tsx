"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Container from "@/components/ui/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link as LinkIcon } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Color, Size } from "@/types";

// Interface for Creator Profile data
interface CreatorProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  portfolioUrl: string | null;
  profileCardBackground?: string | null;
  createdAt: string;
}

// Interface for Design Item data
interface MarketplaceDesignItem {
  id: string; // SavedDesign ID
  productId: string; // Derived Product ID
  name: string; // Derived product name
  price: number;
  productImage: string | null;
  designImageUrl?: string | null;
  mockupImageUrl?: string | null;
  color: Color;
  size: Size;
  creator?: { id: string; name?: string | null; image?: string | null } | null;
}

const CreatorProfilePage = (): React.ReactElement | null => {
  // Hooks called at the top level of the component
  const params = useParams<{ creatorId: string }>();
  const creatorId = params?.creatorId;

  // State for profile
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State for creator's designs
  const [creatorDesigns, setCreatorDesigns] = useState<MarketplaceDesignItem[]>(
    []
  );
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  const [designsError, setDesignsError] = useState<string | null>(null);

  // Effect for fetching profile data
  useEffect(() => {
    if (!creatorId) {
      setIsLoadingProfile(false);
      setIsLoadingDesigns(false); // Also stop design loading if no ID
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      setProfile(null);
      try {
        const response = await fetch(`/api/creators/${creatorId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setProfileError("Creator not found.");
          } else {
            const errorData = await response.text();
            console.error("API Error Response (Profile):", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data: CreatorProfile = await response.json();
          setProfile(data);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch creator profile:", err);
        let message = "Failed to load profile.";
        if (err instanceof Error) {
          message = err.message;
        }
        setProfileError(message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [creatorId]);

  // Effect for fetching creator's designs data
  useEffect(() => {
    if (!creatorId || isLoadingProfile) {
      if (!creatorId) setIsLoadingDesigns(false);
      return;
    }
    if (profileError || !profile) {
      setIsLoadingDesigns(false);
      setCreatorDesigns([]);
      return;
    }

    const fetchCreatorDesigns = async () => {
      setIsLoadingDesigns(true);
      setDesignsError(null);
      setCreatorDesigns([]);
      try {
        // Use relative path assuming /api/marketplace/designs exists and handles creatorId filter
        const response = await axios.get<MarketplaceDesignItem[]>(
          `/api/marketplace/designs?creatorId=${creatorId}`
        );
        setCreatorDesigns(response.data);
      } catch (err: unknown) {
        console.error("Failed to fetch creator designs:", err);
        let message = "Failed to load creator's designs.";
        if (err instanceof Error) {
          message = err.message;
        }
        setDesignsError(message);
        // Avoid duplicate toast if profile error already shown
        if (!profileError) {
          toast.error("Could not load creator's designs.");
        }
      } finally {
        setIsLoadingDesigns(false);
      }
    };

    fetchCreatorDesigns();
  }, [creatorId, profile, profileError, isLoadingProfile]); // Dependencies ensure this runs after profile fetch completes (or fails)

  // --- Conditional Rendering ---

  if (isLoadingProfile) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      </Container>
    );
  }

  if (profileError) {
    return (
      <Container>
        <div className="px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {profileError === "Creator not found."
              ? "Creator Not Found"
              : "Error"}
          </h1>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            {profileError === "Creator not found."
              ? "The requested creator profile could not be found."
              : profileError}
          </p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <div className="px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Creator Not Found
          </h1>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            The creator profile could not be loaded.
          </p>
        </div>
      </Container>
    );
  }

  // Profile loaded successfully, render content
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Container>
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        {/* Profile Info Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-2 border-gray-300 dark:border-gray-700">
            <AvatarImage
              src={profile.image ?? undefined}
              alt={profile.name ?? "Creator Avatar"}
            />
            <AvatarFallback className="text-3xl">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {profile.name ?? "Unnamed Creator"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Member since {memberSince}
            </p>
            {profile.bio && (
              <p className="mt-4 text-base text-gray-700 dark:text-gray-300 max-w-xl">
                {profile.bio}
              </p>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                <LinkIcon className="mr-1 h-4 w-4" />
                View Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Designs Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Designs by {profile.name ?? "this creator"}
          </h2>

          {/* Design List Rendering */}
          {isLoadingDesigns && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
            </div>
          )}
          {designsError && (
            <p className="text-center text-red-500 dark:text-red-400">
              {designsError}
            </p>
          )}
          {!isLoadingDesigns &&
            !designsError &&
            creatorDesigns.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                This creator hasn't published any designs yet.
              </p>
            )}
          {!isLoadingDesigns && !designsError && creatorDesigns.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {creatorDesigns.map(
                (
                  design: MarketplaceDesignItem // Add type annotation
                ) => (
                  <Link
                    key={design.id}
                    href={`/designs/${design.id}`}
                    className="block border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 group"
                  >
                    <div className="aspect-square relative bg-gray-100 dark:bg-zinc-700">
                      {design.productImage ||
                      design.mockupImageUrl ||
                      design.designImageUrl ? (
                        <Image
                          src={
                            design.productImage ||
                            design.mockupImageUrl ||
                            design.designImageUrl ||
                            "/placeholder.png"
                          }
                          alt={design.name}
                          fill
                          className="object-cover group-hover:opacity-75 transition-opacity"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-zinc-600">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p
                        className="font-semibold text-lg text-black dark:text-white truncate"
                        title={design.name}
                      >
                        {design.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(design.price)}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default CreatorProfilePage;
