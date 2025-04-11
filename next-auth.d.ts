import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./types"; // Import UserRole from local types.ts

declare module "next-auth" {
  /**
   * Represents the session object returned by `useSession`, `getSession`, etc.
   */
  interface Session extends DefaultSession {
    user: {
      id: string; // Add the user ID property
      role: UserRole; // Add the role property
      bio?: string | null; // Add bio
      portfolioUrl?: string | null; // Add portfolio URL
      profileCardBackground?: string | null; // Add profile card background
    } & DefaultSession["user"];
    accessToken?: string; // Add the access token property to the session
    refreshToken?: string; // Add the refresh token property to the session
  }

  /**
   * Represents the User model returned by the authorize callback.
   * This should match the shape returned by our `authenticateWithBackend` function.
   */
  interface User extends DefaultUser {
    // Add custom properties expected from the backend/authorize callback
    role: UserRole;
    bio?: string | null; // Add bio
    portfolioUrl?: string | null; // Add portfolio URL
    profileCardBackground?: string | null; // Add profile card background
    // id is already part of DefaultUser
  }
}

declare module "next-auth/jwt" {
  /**
   * Represents the JWT payload.
   */
  interface JWT extends DefaultJWT {
    id: string; // Add the user ID to the JWT payload
    role: UserRole;
    bio?: string | null; // Add bio
    portfolioUrl?: string | null; // Add portfolio URL
    profileCardBackground?: string | null; // Add profile card background
    accessToken?: string; // Add the access token property to the JWT payload
    refreshToken?: string; // Add the refresh token property to the JWT payload
  }
}
