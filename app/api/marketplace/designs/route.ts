import { NextResponse, NextRequest } from "next/server";

// Define the expected shape of the design item from the backend if needed
// interface BackendDesignItem { ... }

export async function GET(req: NextRequest) {
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

  // Extract search parameters from the incoming request URL
  const { searchParams } = new URL(req.url);

  // Construct the backend URL by appending the search parameters
  // This forwards parameters like creatorId, search, tags, sort, etc.
  const backendUrlWithParams = `${backendApiUrl}/marketplace/designs?${searchParams.toString()}`;

  try {
    console.log(
      `Fetching marketplace designs from backend: ${backendUrlWithParams}`
    );
    const res = await fetch(backendUrlWithParams, {
      // Optional: Add caching strategy if needed
      // next: { revalidate: 60 }, // Revalidate every minute example
      // Optional: Add headers if required by your backend
      // headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
    });

    if (!res.ok) {
      console.error(
        `Backend fetch failed for marketplace designs: Status ${res.status}, URL: ${backendUrlWithParams}`
      );
      // Forward the status code and error message from the backend if possible
      const errorBody = await res.text();
      try {
        // Try parsing as JSON, otherwise use text
        const errorJson = JSON.parse(errorBody);
        return new NextResponse(JSON.stringify(errorJson), {
          status: res.status,
        });
      } catch {
        return new NextResponse(errorBody, { status: res.status });
      }
    }

    // Assuming the backend returns an array of design items
    const designs = await res.json();

    // Return the fetched data
    return NextResponse.json(designs);
  } catch (error) {
    console.error(`Error fetching marketplace designs from backend:`, error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Return a generic error for connection issues or unexpected errors
    return new NextResponse(
      JSON.stringify({
        message: "Failed to connect to backend service",
        error: errorMessage,
      }),
      { status: 503 }
    ); // Service Unavailable
  }
}
