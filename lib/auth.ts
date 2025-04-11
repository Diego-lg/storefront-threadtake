import { AuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@/types"; // Import UserRole

// Define the shape of the user object returned by the backend + the token
interface BackendUserResponse extends NextAuthUser {
  accessToken: string;
  refreshToken?: string; // Add refreshToken (optional for now)
  role: UserRole; // Make role mandatory to match base User type
  // Add other properties returned by your backend user object if necessary
}

// Helper function to simulate the backend login and get user data
async function authenticateWithBackend(
  credentials: Record<"email" | "password", string> | undefined
): Promise<BackendUserResponse | null> {
  // Update return type annotation
  if (!credentials?.email || !credentials?.password) {
    // Return null or throw error based on desired handling
    // Throwing error aligns with authorize function expectation
    throw new Error("Missing email or password");
  }

  const backendLoginUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`; // Use the new custom login endpoint

  try {
    // Call the custom backend login endpoint
    const response = await fetch(backendLoginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Send JSON
      },
      // Body is now a JSON string
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      // Attempt to get error message from backend response if available
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.message ||
        `Backend authentication failed: ${response.statusText}`;
      console.error("Backend Auth Error:", errorMessage, response.status);
      throw new Error(errorMessage); // Throw error to be caught by NextAuth
    }

    const data = await response.json();

    // Check if the backend returned user data and a token
    // Check for user data, accessToken (data.token), and potentially refreshToken
    if (data?.user?.id && data?.user?.email && data?.token) {
      // Ensure role is defined, assign default if necessary
      const userRole = data.user.role ?? UserRole.USER;
      if (data.user.role === undefined || data.user.role === null) {
        console.warn(
          `Backend did not return a role for user ${data.user.email}. Assigning default role USER.`
        );
      }

      // Return both user data and the token, ensuring role is included
      return {
        ...data.user, // Spread user properties (id, email, name, image)
        role: userRole, // Assign the determined role (backend's or default)
        accessToken: data.token, // Add the access token
        refreshToken: data.refreshToken, // Add the refresh token (if provided by backend)
      };
      // Note: The returned object shape needs to be compatible with what NextAuth expects
      // or be handled correctly in the jwt callback. Adding accessToken here.
    } else {
      console.error("Backend response missing user data or token:", data);
      throw new Error("Backend did not return valid authentication data");
    }
  } catch (error) {
    console.error("Error during backend authentication request:", error);
    // Re-throw the error or a generic one
    throw new Error(
      error instanceof Error ? error.message : "Authentication error"
    );
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // This authorize function delegates the actual check to the backend
      async authorize(credentials) {
        try {
          // authenticateWithBackend now returns user data + accessToken
          const backendResponse = await authenticateWithBackend(credentials);
          if (backendResponse) {
            // Role assignment is now handled within authenticateWithBackend
            // Return the combined object (user + token)
            return backendResponse;
          }
          return null; // Indicate failure
        } catch (error) {
          console.error("Authorize error:", error);
          // Throwing the error here signals NextAuth about the failure
          // It will be caught and potentially shown to the user on the login page
          throw error;
        }
      },
    }),
    // Add other providers (Google, etc.) here if needed. They would likely
    // also need configuration pointing to the backend's corresponding callbacks.
  ],
  session: {
    strategy: "jwt", // Use JWT for sessions in the storefront as well
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Use the same secret as the backend
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login", // Redirect users here if they need to sign in
    error: "/login", // Redirect to login page on error (e.g., invalid credentials)
  },
  callbacks: {
    // The 'user' object here comes from the 'authorize' function's return value
    // The 'session' object here (when trigger is 'update') comes from the client's update() call
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.name = user.name; // Add name on initial sign in
        token.email = user.email; // Add email on initial sign in
        token.image = user.image; // Add image on initial sign in
        // Types are defined in next-auth.d.ts
        token.role = (user as BackendUserResponse).role; // Use BackendUserResponse type
        token.accessToken = (user as BackendUserResponse).accessToken;
        token.refreshToken = (user as BackendUserResponse).refreshToken; // Store refreshToken in JWT
      }

      // Handle session updates (e.g., profile picture or name change)
      if (trigger === "update" && session) {
        // Merge the updated data from the client into the token
        // Ensure you only merge fields you expect/allow to be updated
        if (session?.name) {
          token.name = session.name;
        }
        if (session?.image) {
          token.image = session.image;
        }
        // Merge other updatable fields defined in next-auth.d.ts Session type
        if (session?.bio !== undefined) {
          // Check for undefined to allow setting null/empty
          token.bio = session.bio;
        }
        if (session?.portfolioUrl !== undefined) {
          token.portfolioUrl = session.portfolioUrl;
        }
        if (session?.profileCardBackground !== undefined) {
          token.profileCardBackground = session.profileCardBackground;
        }
      }

      return token;
    },
    // The 'token' object here comes from the 'jwt' callback
    async session({ session, token }) {
      // Add properties from the JWT token to the session object
      // Ensure session.user exists before assigning properties
      if (session.user) {
        // Types are defined in next-auth.d.ts
        session.user.id = token.id as string; // Assert type
        session.user.name = token.name as string | null | undefined; // Assert type
        session.user.email = token.email as string; // Already asserted
        session.user.image = token.image as string | null | undefined; // Assert type (Fixes TS error)
        session.user.role = token.role as UserRole; // Assign token.role (UserRole) to session.user.role (UserRole)
        // Copy custom fields from token to session.user
        session.user.bio = token.bio as string | null | undefined; // Assert type
        session.user.portfolioUrl = token.portfolioUrl as
          | string
          | null
          | undefined; // Assert type
        session.user.profileCardBackground = token.profileCardBackground as
          | string
          | null
          | undefined; // Assert type

        // Add the accessToken to the session object if it exists in the token
        if (token.accessToken) {
          // Make sure to update next-auth.d.ts to include accessToken in the Session type
          // Type is defined in next-auth.d.ts
          session.accessToken = token.accessToken as string; // Add type assertion
        }
        // Add the refreshToken to the session object if it exists in the token
        if (token.refreshToken) {
          // Make sure to update next-auth.d.ts to include refreshToken in the Session type
          session.refreshToken = token.refreshToken as string; // Add type assertion
        }
      }
      return session;
    },
  },
  // Enable debug messages in development
  debug: process.env.NODE_ENV === "development",
};
