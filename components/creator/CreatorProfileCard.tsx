import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShineBorder } from "@/components/magicui/shine-border"; // Import ShineBorder (Named Import)

// Define the expected props based on the plan
interface Creator {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  profileCardBackground?: string | null; // Added for Phase 2
}

interface CreatorProfileCardProps {
  creator: Creator | null; // Allow null creator for safety
}

export const CreatorProfileCard = ({ creator }: CreatorProfileCardProps) => {
  if (!creator) {
    // Optionally render a placeholder or null if creator data isn't available
    return null;
  }

  const fallbackInitial = creator.name?.charAt(0)?.toUpperCase() ?? "?";

  // Determine background style (Phase 2)
  const backgroundStyle: React.CSSProperties = {};
  if (creator.profileCardBackground) {
    // Basic check if it looks like a URL
    if (
      creator.profileCardBackground.startsWith("http") ||
      creator.profileCardBackground.startsWith("/")
    ) {
      backgroundStyle.backgroundImage = `url(${creator.profileCardBackground})`;
      backgroundStyle.backgroundSize = "cover"; // Optional: adjust as needed
      backgroundStyle.backgroundPosition = "center"; // Optional: adjust as needed
    } else {
      // Assume it's a color or gradient
      backgroundStyle.background = creator.profileCardBackground;
    }
  }

  return (
    // Parent container with relative positioning
    <div className="relative rounded-lg overflow-hidden group">
      {/* ShineBorder as an absolutely positioned sibling */}

      {/* Card component as a relatively positioned sibling on top */}
      <Card
        className="relative z-10 overflow-hidden w-full h-full bg-background"
        style={backgroundStyle}
      >
        {" "}
        <ShineBorder
          className="absolute inset-0 size-full rounded-[inherit] pointer-events-none" // Use inherit, ensure it's behind content
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          borderWidth={3} // Increased border width
        />
        {/* Apply style, ensure card fills border, ensure it's above border */}
        {/* Overlay for text readability */}
        {creator.profileCardBackground && ( // Only add overlay if a custom background is set
          <div className="absolute inset-0 bg-black/30 z-5"></div>
        )}
        {/* Inner content container - needs relative positioning and higher z-index */}
        <div className="relative z-10">
          <Link
            href={`/creators/${creator.id}`}
            className="block hover:bg-black/10 transition-colors" // Adjusted hover for overlay
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage
                  src={creator.image ?? undefined}
                  alt={creator.name ?? "Creator avatar"}
                />
                <AvatarFallback>{fallbackInitial}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {creator.name ?? "Unknown Creator"}
                </CardTitle>
                {/* Optional: Add a subtitle or tagline if available later */}
                {/* <CardDescription>Creator Tagline</CardDescription> */}
              </div>
            </CardHeader>
            {creator.bio && (
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {" "}
                  {/* Limit bio lines */}
                  {creator.bio}
                </p>
              </CardContent>
            )}
          </Link>
        </div>{" "}
        {/* Close inner content div */}
      </Card>
    </div> // Close parent container
  );
};

export default CreatorProfileCard;
