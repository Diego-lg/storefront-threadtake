import { Product } from "@/types";
import NoResults from "@/components/ui/no-results";
import ProductCart from "./ui/product-cart";

interface ProductListProps {
  title: string;
  items: Product[];
}
const ProductList: React.FC<ProductListProps> = ({ title, items }) => {
  return (
    <div className="space-y-4">
      <h3 className="fold-bold text-3xl">{title}</h3>
      {items.length === 0 && <NoResults />}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id}>
            <ProductCart key={item.id} data={item} />
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProductList;
