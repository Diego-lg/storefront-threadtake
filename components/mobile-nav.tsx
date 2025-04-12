"use client";

import Link from "next/link";
import { Category } from "@/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarActions from "@/components/navbar-actions"; // Import NavbarActions
import { cn } from "@/libs/utils";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  data: Category[];
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ data, isOpen, onClose }) => {
  const pathname = usePathname();

  // Create routes similar to MainNav
  const routes = data.map((route) => ({
    href: `/category/${route.id}`,
    label: route.name,
    active: pathname === `/category/${route.id}`,
  }));

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex lg:hidden" // Use flex, only show on small screens
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/25"
        aria-hidden="true"
        onClick={onClose} // Close on overlay click
      />

      {/* Mobile Nav Panel */}
      <div className="relative mr-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-neutral-900 py-4 pb-12 shadow-xl">
        {/* Close button */}
        <div className="flex items-center justify-between px-4">
          <Link href="/" className="flex items-center" onClick={onClose}>
            <p className="font-bold text-xl text-black dark:text-white">
              Thread Take
            </p>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mr-2"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-black dark:text-white" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {/* Marketplace Link */}
          <Link
            href="/marketplace"
            onClick={onClose} // Close menu on link click
            className={cn(
              "block rounded-md px-3 py-2 text-base font-medium",
              pathname === "/marketplace"
                ? "bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            )}
          >
            Marketplace
          </Link>
          {/* Category Links */}
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={onClose} // Close menu on link click
              className={cn(
                "block rounded-md px-3 py-2 text-base font-medium",
                route.active
                  ? "bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Actions at the bottom */}
        <div className="mt-auto border-t border-neutral-200 dark:border-neutral-700 pt-4 px-4">
          {/* We need to adjust NavbarActions or pass props if it relies on context unavailable here */}
          {/* For simplicity, let's render it directly, assuming it works standalone */}
          <div className="flex justify-center">
            {" "}
            {/* Center actions */}
            <NavbarActions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
