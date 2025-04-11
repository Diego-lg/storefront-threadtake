import { create } from "zustand";
import { Product } from "@/types";
import { persist, createJSONStorage } from "zustand/middleware";
import toast from "react-hot-toast";
import { get } from "http";
interface UseCartStore {
  items: Product[];
  addItem: (data: Product) => void;
  removeItem: (ids: { productId: string; sizeId?: string }) => void; // Accept product and optional size ID
  removeAll: () => void;
}
const useCart = create(
  persist<UseCartStore>(
    (set, get) => ({
      items: [],
      addItem: (data: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.id === data.id && item.size?.id === data.size?.id
        ); // Check size ID too
        if (existingItem) {
          return toast("Item already in cart");
        }
        set({ items: [...currentItems, data] });
        toast.success("Item added to cart");
      },
      removeItem: (ids: { productId: string; sizeId?: string }) => {
        set({
          items: get().items.filter(
            (item) =>
              !(item.id === ids.productId && item.size?.id === ids.sizeId) // Remove only if both product and size match
          ),
        });
        toast.success("Item removed from cart");
      },
      removeAll: () => {
        set({ items: [] });
        toast.success("All items removed from cart");
      },
    }),
    { name: "cart-storage", storage: createJSONStorage(() => localStorage) }
  )
);

export default useCart;
