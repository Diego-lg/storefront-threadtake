import React from "react";
import { Instagram, Twitter, Facebook } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-background border-t border-border py-12 px-8 text-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            THREAD TAKE
          </h3>
          <p className="text-muted-foreground text-sm">
            Premium essentials crafted with the finest materials for everyday
            luxury.
          </p>
          <div className="flex space-x-4 mt-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter size={20} />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">SHOP</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                All Products
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Arrivals
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Best Sellers
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">HELP</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Shipping & Returns
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Size Guide
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">ABOUT</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Our Story
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sustainability
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} THREAD TAKE. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
