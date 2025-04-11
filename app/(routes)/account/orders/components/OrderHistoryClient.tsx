"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Currency from "@/components/ui/currency"; // Assuming Currency component exists for formatting

// Define types for the fetched order data (based on backend API response)
interface OrderItemProduct {
  id: string;
  name: string;
  price: string; // Price comes as string/Decimal, convert to number
  images: { url: string }[];
}

interface OrderItem {
  id: string; // Assuming OrderItem has an ID, though maybe not needed for display
  product: OrderItemProduct;
  // Add quantity here if your backend includes it
}

interface OrderData {
  id: string;
  isPaid: boolean;
  phone: string;
  address: string;
  createdAt: string; // ISO string date
  orderItems: OrderItem[];
  total: number; // Total calculated by the backend
  // Include store details if needed and returned by API
}

const OrderHistoryClient = () => {
  const { status } = useSession(); // Remove unused 'session'
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return; // Wait until session status is determined
    }

    if (status === "unauthenticated") {
      // Redirect to login if not authenticated
      router.push("/login?callbackUrl=/account/orders");
      return;
    }

    if (status === "authenticated") {
      const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        const ordersUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/orders`;
        try {
          const response = await axios.get<OrderData[]>(ordersUrl, {
            withCredentials: true, // Send session cookies
          });
          setOrders(response.data);
        } catch (err) {
          console.error("Failed to fetch orders:", err);
          setError(
            "Could not load your order history. Please try again later."
          );
          toast.error("Could not load your order history.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [status, router]);

  if (isLoading || status === "loading") {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading your order history...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-600 dark:text-red-400">{error}</p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        You haven&apos;t placed any orders yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-lg p-4 sm:p-6 bg-white dark:bg-zinc-800 dark:border-zinc-700 shadow"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Order #{order.id.substring(0, 8)}...
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-black dark:text-white">
                Total: <Currency value={order.total} />
              </p>
              <p
                className={`text-sm font-medium ${
                  order.isPaid
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {order.isPaid ? "Paid" : "Pending Payment"}
              </p>
            </div>
          </div>

          <ul className="space-y-4">
            {order.orderItems.map((item) => (
              <li
                key={item.product.id}
                className="flex items-center gap-4 border-t pt-4 dark:border-zinc-700 first:border-t-0 first:pt-0"
              >
                <div className="relative h-16 w-16 rounded-md overflow-hidden sm:h-20 sm:w-20 flex-shrink-0 bg-gray-100 dark:bg-zinc-700">
                  {item.product.images?.[0]?.url ? (
                    <Image
                      fill
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="object-cover"
                      sizes="(max-width: 640px) 4rem, 5rem"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black dark:text-white">
                    {item.product.name}
                  </p>
                  {/* Add size/color here if available on OrderItem */}
                  {/* <p className="text-sm text-gray-500 dark:text-gray-400">Size: {item.size?.name}</p> */}
                  {/* <p className="text-sm text-gray-500 dark:text-gray-400">Color: {item.color?.name}</p> */}
                </div>
                <div className="text-right">
                  <Currency value={Number(item.product.price)} />
                  {/* Add quantity if available: e.g., <p className="text-sm text-gray-500">Qty: {item.quantity}</p> */}
                </div>
              </li>
            ))}
          </ul>
          {/* Optionally display shipping address/phone if needed */}
          {/* <div className="mt-4 pt-4 border-t dark:border-zinc-700">
             <p className="text-sm text-gray-600 dark:text-gray-300">Address: {order.address}</p>
             <p className="text-sm text-gray-600 dark:text-gray-300">Phone: {order.phone}</p>
          </div> */}
        </div>
      ))}
    </div>
  );
};

export default OrderHistoryClient;
