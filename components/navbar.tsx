import getCategories from "@/actions/get-categories";
import NavbarClient from "./navbar-client"; // Import the new client component

export const revalidate = 0;

const Navbar = async () => {
  const categories = await getCategories(); // Fetch data on the server

  // Render the Client Component and pass the fetched data as props
  return <NavbarClient data={categories} />;
};

export default Navbar;
