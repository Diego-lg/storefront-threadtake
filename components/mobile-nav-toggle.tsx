"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

const MobileNavToggle: React.FC<MobileNavToggleProps> = ({
  isOpen,
  onClick,
}) => {
  return (
    <Button
      variant="ghost" // Use ghost or outline variant if available
      size="icon" // Use icon size if available
      onClick={onClick}
      className="lg:hidden" // Ensure it's only visible on small screens if not handled by parent
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  );
};

export default MobileNavToggle;
