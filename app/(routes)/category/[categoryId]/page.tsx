import getCategory from "@/actions/get-category";
import getProducts from "@/actions/get-products";
import getSizes from "@/actions/get-sizes";
import getColors from "@/actions/get-sizes copy";
import Billboard from "@/components/billboard";
import Container from "@/components/ui/container";

import NoResults from "@/components/ui/no-results";
import ProductCart from "@/components/ui/product-cart";
import MobileFilters from "../../product/[productId]/components/mobile-filters";
import Filter from "../../product/[productId]/components/filter";
export const revalidate = 0;

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{
    colorId: string;
    sizeId: string;
  }>;
}

const CategoryPage: React.FC<CategoryPageProps> = async ({
  params,
  searchParams,
}) => {
  const { categoryId } = await params;
  const sizes = await getSizes();
  const colors = await getColors();
  const { colorId, sizeId } = await searchParams;

  const products = await getProducts({
    categoryId: categoryId,
    colorId: colorId,
    sizeId: sizeId,
  });

  const category = await getCategory(categoryId);
  return (
    <div className="bg-white">
      <Container>
        <Billboard data={category.billboard} />
        <div className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="lg:grid lg:grid-cols-5 lg:gap-x-8">
            <MobileFilters sizes={sizes} colors={colors} />
            <div className="hidden lg:block">
              <Filter valueKey="sizeId" name="Sizes" data={sizes} />{" "}
              <Filter valueKey="colorId" name="Colors" data={colors} />
            </div>
            <div className="mt-6 lg:col-span-4 lg:mt-0">
              {products.length === 0 && <NoResults />}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((item) => (
                  <ProductCart key={item.id} data={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CategoryPage;
