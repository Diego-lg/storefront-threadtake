"use client"; // Make this a Client Component

import { useState } from "react"; // Import useState
import Link from "next/link";
import Container from "@/components/ui/container";
import MainNav from "@/components/main-nav";
import NavbarActions from "@/components/navbar-actions";
import MobileNavToggle from "@/components/mobile-nav-toggle"; // Import Toggle (will create)
import MobileNav from "@/components/mobile-nav"; // Import Mobile Nav
import { Category } from "@/types"; // Import Category type

interface NavbarClientProps {
  data: Category[]; // Receive categories as a prop
}

const NavbarClient: React.FC<NavbarClientProps> = ({ data }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Add state for mobile menu
  // Removed async and getCategories call
  return (
    <div className="border-b">
      <Container>
        <div className="relative px-4 sm:px-6 lg:px-8 flex h-16 items-center">
          <Link href="/" className="ml-4 flex lg:ml-0 gap-x-2">
            <p className="font-bold text-xl">Thread Heaven</p>
          </Link>
          {/* MainNav hidden on small screens, shown on lg and up */}
          <div className="hidden lg:block">
            <MainNav data={data} /> {/* Use prop data */}
          </div>
          <div className="ml-auto flex items-center">
            {" "}
            {/* Wrapper for actions and toggle */}
            <div className="hidden lg:block">
              {" "}
              {/* Hide actions wrapper on small screens if needed, or adjust layout */}
              <NavbarActions /> {/* Renders the client component */}
            </div>
            {/* Mobile Nav Toggle - shown only on small screens */}
            <div className="lg:hidden ml-4">
              {" "}
              {/* Add margin-left */}
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>
        </div>
      </Container>
      {/* Render Mobile Nav conditionally - We will create this component next */}
      <MobileNav
        data={data}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
};

export default NavbarClient;
