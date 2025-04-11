import Container from "@/components/ui/container";
import MarketplaceDesignsClient from "./components/MarketplaceDesignsClient"; // Renamed import

export const revalidate = 0; // Revalidate data on every request

const MarketplacePage = () => {
  // Renamed component
  return (
    <Container>
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Marketplace Designs
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse designs listed for sale by our talented creators.
        </p>
        <div className="mt-8">
          {/* Client component handles fetching and displaying */}
          <MarketplaceDesignsClient />
        </div>
      </div>
    </Container>
  );
};

export default MarketplacePage; // Renamed export
