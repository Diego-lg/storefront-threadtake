"use client";

import Image from "next/image";
import React, { useState, ChangeEvent } from "react";

// Separate the image generation logic to be exported independently
export const generateImageUrl = async (
  prompt: string
): Promise<string | null> => {
  console.log("generateImageUrl called with prompt:", prompt);
  const apiEndpoint = process.env.NEXT_PUBLIC_TEXT_TO_IMAGE; // Use the correct env variable

  if (!apiEndpoint) {
    console.error(
      "Error: NEXT_PUBLIC_TEXT_TO_IMAGE environment variable is not set."
    );
    throw new Error("Image generation service is not configured.");
  }
  // const apiKey = process.env.IMAGE_GENERATOR_API_KEY; // Remove API Key logic

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    // if (apiKey) { // Remove API Key logic
    //   headers["Authorization"] = `Bearer ${apiKey}`;
    // }
    console.log("Making request to:", apiEndpoint, "with headers:", headers);
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ input: prompt }), // Correct body format
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const blob = await response.blob();
    console.log("Response was a blob");
    const imgUrl = URL.createObjectURL(blob);
    console.log("Generated image URL:", imgUrl);
    return imgUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void; // Renaming or adding a new prop like onTextureGenerated might be clearer, but let's reuse for now.
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onImageGenerated,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const generateImage = async (prompt: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const imgUrl = await generateImageUrl(prompt);
      setImageSrc(imgUrl); // Store the image URL in state

      return imgUrl;
    } catch (error) {
      setError((error as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndApply = async () => {
    // This function specifically handles the "Generate & Apply Texture" button
    // setImageSrc(null); // Don't display the image locally in this component for this action
    setError(null);
    setLoading(true);
    try {
      const imgUrl = await generateImageUrl(inputValue);
      if (imgUrl && onImageGenerated) {
        onImageGenerated(imgUrl); // Pass the URL up to the parent for the 3D model
      } else if (!imgUrl) {
        setError("Failed to generate image.");
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // You can use imageSrc here as needed
  const generatedImage = imageSrc ? (
    <Image
      src={imageSrc}
      alt="Generated"
      className="mt-4 max-w-full"
      width={512}
      height={512}
    />
  ) : null; // Keep definition in case it's used elsewhere, but remove from render

  return (
    <div className="flex items-center space-x-2 w-full">
      {" "}
      {/* Added w-full */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter prompt for AI texture..."
        required
        className="px-4 py-2 rounded border bg-input text-foreground flex-grow" // Use theme colors, flex-grow
      />
      <button
        type="button" // Change to type="button"
        onClick={handleGenerateAndApply} // Call the specific handler
        disabled={loading || !inputValue} // Disable if loading or no input
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50" // Use theme colors, add disabled style
      >
        {loading ? "Generating..." : "Generate & Apply"}
      </button>
      {/* Consider moving error display outside this component or below */}
      {/* {error && <p className="text-red-500 mt-2 text-xs">{error}</p>} */}
      {/* Remove local image display: {generatedImage} */}
    </div>
  );
};

// Export both the component and the generate function
export default ImageGenerator;
