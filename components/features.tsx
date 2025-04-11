import React from "react";
import { Truck, RotateCcw, Shield } from "lucide-react";

function Features() {
  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Truck size={32} className="text-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Free Shipping
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Free standard shipping on all orders.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <RotateCcw size={32} className="text-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Easy Returns
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              30-day return policy for a full refund or exchange.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <Shield size={32} className="text-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Quality Guarantee
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              All products backed by our 1-year quality guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
