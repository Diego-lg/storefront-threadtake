// Data fetching
import getBillboards from "@/actions/get-billboards";
import getProducts from "@/actions/get-products";
import getCategories from "@/actions/get-categories"; // Import getCategories

// UI Components
import Container from "@/components/ui/container";
import ProductList from "@/components/product-list";
import Hero from "@/components/hero-section";
import CategorySection from "@/components/category-section";
import Features from "@/components/features";
import InstagramFeed from "@/components/instagram-feed";
import Roadmap from "@/components/roadmap";
import { VideoShowcase } from "@/components/video_showcase";
export const revalidate = 0;

const HomePage = async () => {
  // Parallel data fetching for better performance
  // Fetch products, billboards, and categories in parallel
  const [products, billboards, categories] = await Promise.all([
    getProducts({ isFeatured: true }),
    getBillboards(),
    getCategories(), // Fetch categories
  ]);

  return (
    <>
      <Hero />
      {/* Pass categories to CategorySection instead of billboards */}{" "}
      <VideoShowcase />
      <Container>
        {" "}
        <CategorySection categories={categories} />
        <div className="space-y-10 pb-10">
          <div className="flex flex-col gap-y-8 px-4 sm:px-6 lg:px-8">
            <ProductList title="Featured Products" items={products} />
          </div>
        </div>
      </Container>{" "}
      <Roadmap />
      <InstagramFeed />
      <Features />
    </>
  );
};

export default HomePage;
