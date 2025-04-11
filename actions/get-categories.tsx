import { Category } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/storefront/categories`;

const getCategories = async (): Promise<Category[]> => {
  // Add { cache: 'no-store' } to bypass server-side fetch cache
  const res = await fetch(URL, { cache: "no-store" });

  // Add error handling for the fetch itself
  if (!res.ok) {
    throw new Error(
      `Failed to fetch categories: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
};
export default getCategories;
