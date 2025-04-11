import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import prismadb from "@/lib/prismadb"; // Use storefront's prismadb instance
import { authOptions } from "@/lib/auth"; // Use storefront's authOptions

export const dynamic = "force-dynamic"; // Force dynamic rendering
export async function GET(req: Request) {
  try {
    console.log("[STOREFRONT_MY_DESIGNS_GET] Attempting to get session...");
    // Use the authOptions defined within this storefront project
    const session = await getServerSession(authOptions);
    console.log(
      "[STOREFRONT_MY_DESIGNS_GET] Session retrieved:",
      JSON.stringify(session, null, 2)
    ); // Log the session object

    if (!session?.user?.id) {
      console.log(
        "[STOREFRONT_MY_DESIGNS_GET] Authentication failed: No session or user ID found."
      );
      // Ensure this returns a standard Response or NextResponse
      return new NextResponse(JSON.stringify({ message: "Unauthenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[STOREFRONT_MY_DESIGNS_GET] Authenticated user ID: ${session.user.id}`
    );
    const userId = session.user.id;

    // Fetch designs for the authenticated user
    const designs = await prismadb.savedDesign.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      // Include necessary fields if the frontend component expects them
      // select: { ... }
    });

    return NextResponse.json(designs);
  } catch (error) {
    console.error("[STOREFRONT_MY_DESIGNS_GET]", error);
    // Ensure this returns a standard Response or NextResponse
    return new NextResponse(JSON.stringify({ message: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
