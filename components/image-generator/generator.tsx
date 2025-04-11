"use client";

import Image from "next/image";
import React, { useState, FormEvent, ChangeEvent } from "react";

// Separate the image generation logic to be exported independently
export const generateImageUrl = async (
  prompt: string
): Promise<string | null> => {
  console.log("generateImageUrl called with prompt:", prompt);
  const apiEndpoint =
    process.env.NEXT_PUBLIC_IMAGE_GENERATOR_API_ENDPOINT ||
    "http://localhost:5000/generate";
  const apiKey = process.env.IMAGE_GENERATOR_API_KEY;

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    console.log("Making request to:", apiEndpoint, "with headers:", headers);
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ input: prompt }),
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImageSrc(null);
    const imageUrl = await generateImage(inputValue);
    if (imageUrl && onImageGenerated) {
      onImageGenerated(imageUrl); // Call onImageGenerated with the new URL
    }
  };

  const handleGenerateAndApply = async () => {
    // This function specifically handles the "Generate & Apply Texture" button
    setImageSrc(null); // Don't display the image locally in this component for this action
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
  ) : null;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter prompt"
          required
          className="px-4 py-2 mr-2 rounded border bg-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {generatedImage}
    </div>
  );
};

// Export both the component and the generate function
export default ImageGenerator;
