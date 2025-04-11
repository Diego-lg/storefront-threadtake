"use client";
import { cn } from "@/libs/utils"; // Added cn import
import {
  ShoppingBag,
  // User, // Removed unused icon
  LogOut,
  LogIn,
  History,
  Palette,
  Settings, // Added Settings icon
  UserCircle, // Using UserCircle for avatar fallback/trigger
  Shirt, // Added Shirt icon
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Corrected to named import
import { useEffect, useState } from "react";
import useCart from "@/hooks/use-cart";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useUserProfileStore } from "@/hooks/use-user-profile"; // Removed Zustand import

const NavbarActions = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession(); // Still need session for auth status and user name/email
  // const profileImageUrl = useUserProfileStore((state) => state.imageUrl); // Removed Zustand usage
  const router = useRouter();
  const cart = useCart();
  const pathname = usePathname(); // Added pathname hook

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Avoid hydration mismatch
    // Render placeholder or null matching server render until mounted
    return (
      <div className="ml-auto flex items-center gap-x-4">
        {/* Placeholder for cart */}
        <div className="flex items-center rounded-full bg-black px-4 py-2 opacity-50">
          <ShoppingBag size={20} color="white" />
          <span className="ml-2 text-sm font-medium text-white">0</span>
        </div>
        {/* Placeholder for auth */}
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  const handleLogin = () => {
    signIn(); // Redirects to the login page defined in NextAuth options
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" }); // Sign out and redirect to home page
  };

  // Remove previous debug log

  return (
    <div className="ml-auto flex items-center gap-x-2 sm:gap-x-4 rounded-full">
      {/* Generator Link Button */}
      <Link
        href="/generator"
        className={cn(
          "text-sm font-medium transition-colors p-2 rounded-md", // Changed padding to p-2 for icon button look
          pathname === "/generator"
            ? "bg-black text-white hover:bg-gray-800" // Active state
            : "bg-gray-100 text-black hover:bg-gray-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600" // Inactive state (added dark mode styles)
        )}
        aria-label="Generator" // Added aria-label for accessibility
      >
        <Shirt size={20} />
      </Link>
      {/* Cart Button */}
      <Button
        onClick={() => router.push("/cart")}
        className="flex items-center rounded-full bg-black px-4 py-2"
        aria-label="Shopping cart"
      >
        <ShoppingBag size={20} color="white" />
        <span className="ml-2 text-sm font-medium text-white">
          {cart.items.length}
        </span>
      </Button>
      {/* Auth Status and Actions */}
      {status === "loading" && (
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div> // Loading state
      )}
      {status === "unauthenticated" && (
        <Button
          onClick={handleLogin}
          className="flex items-center rounded-md bg-gray-200 dark:bg-zinc-700 px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-600"
          aria-label="Login"
        >
          <LogIn size={18} className="mr-1" />
          Login
        </Button>
      )}
      {status === "authenticated" && session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              // variant="ghost" // Removed variant as it's not supported by the current Button component type
              className="relative h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 p-0" // Added p-0 for potentially better alignment without variant
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                {session?.user?.image ? ( // Use image directly from session
                  <AvatarImage
                    src={session.user.image} // Use image directly from session
                    alt={session.user.name || "User"}
                  />
                ) : null}
                <AvatarFallback>
                  {session.user.name ? (
                    session.user.name.charAt(0).toUpperCase()
                  ) : (
                    <UserCircle size={20} />
                  )}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account/designs">
                <Palette className="mr-2 h-4 w-4" />
                <span>My Designs</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/orders">
                <History className="mr-2 h-4 w-4" />
                <span>Order History</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-100 dark:focus:bg-red-900/40 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
export default NavbarActions;
