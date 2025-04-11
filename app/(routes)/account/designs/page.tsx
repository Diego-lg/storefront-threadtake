import MyDesignsClient from "./components/MyDesignsClient"; // We'll create this client component next
import Container from "@/components/ui/container";

const MyDesignsPage = () => {
  return (
    <Container>
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-8">
          My Saved Designs
        </h1>
        <MyDesignsClient />
      </div>
    </Container>
  );
};

export default MyDesignsPage;
