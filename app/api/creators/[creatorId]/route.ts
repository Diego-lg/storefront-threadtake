import { NextResponse } from "next/server";

// Define the expected shape of the creator profile data from the backend
interface CreatorProfileBackend {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  portfolioUrl: string | null;
  profileCardBackground?: string | null;
  createdAt: string;
  // Add any other fields returned by your actual backend API
}

export async function GET(
  req: Request, // Although req is not directly used for params here, it's part of the signature
  { params }: { params: { creatorId: string } }
) {
  const creatorId = params.creatorId;

  if (!creatorId) {
    return new NextResponse(
      JSON.stringify({ message: "Creator ID is required" }),
      { status: 400 }
    );
  }

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!backendApiUrl) {
    console.error(
      "Backend API URL is not configured in environment variables."
    );
    return new NextResponse(
      JSON.stringify({ message: "Server configuration error" }),
      { status: 500 }
    );
  }

  const fullBackendUrl = `${backendApiUrl}/creators/${creatorId}`; // Assuming backend uses /creators/:id

  try {
    console.log(`Fetching creator profile from backend: ${fullBackendUrl}`);
    const res = await fetch(fullBackendUrl, {
      // Optional: Add caching strategy if needed, e.g., revalidation
      // next: { revalidate: 3600 }, // Revalidate every hour
      // Optional: Add headers if required by your backend
      // headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
    });

    if (!res.ok) {
      console.error(
        `Backend fetch failed for ${creatorId}: Status ${res.status}`
      );
      if (res.status === 404) {
        // If backend returns 404, propagate it
        return new NextResponse(
          JSON.stringify({ message: "Creator not found" }),
          { status: 404 }
        );
      }
      // For other errors, return a generic server error
      return new NextResponse(
        JSON.stringify({
          message: `Failed to fetch data from backend: ${res.statusText}`,
        }),
        { status: res.status }
      );
    }

    const creatorProfile: CreatorProfileBackend = await res.json();

    // Return the fetched data
    return NextResponse.json(creatorProfile);
  } catch (error) {
    console.error(
      `Error fetching creator profile ${creatorId} from backend:`,
      error
    );
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new NextResponse(
      JSON.stringify({
        message: "Failed to connect to backend service",
        error: errorMessage,
      }),
      { status: 503 }
    ); // Service Unavailable or similar
  }
}
