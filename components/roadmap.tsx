"use client";
import React, { useState } from "react";
import { ShoppingBag, Shirt, Palette, Store } from "lucide-react";

const roadmapData = [
  {
    title: "Explore",
    description: "Explore our collection of unique Designs",
    timeline: "Today",
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "from-gray-500 to-gray-700",
  },
  {
    title: "Design",
    description: "Design, create and sell your own Tshirts",
    timeline: "Tomorrow",
    icon: <Shirt className="w-6 h-6" />,
    color: "from-gray-600 to-gray-800",
  },
  {
    title: "Buy",
    description: "Buy designs from other users and support their creativity",
    timeline: "Day After Tomorrow",
    icon: <Palette className="w-6 h-6" />,
    color: "from-gray-700 to-gray-900",
  },
  {
    title: "Receive",
    description: "Delivered to your doorstep",
    timeline: "1 Week",
    icon: <Store className="w-6 h-6" />,
    color: "from-gray-800 to-black",
  },
];

const Roadmap = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Our Journey Forward
          </h2>
          <div className="w-24 h-1 bg-border mx-auto mb-6"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow our path as we grow and evolve to serve you better.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Desktop Timeline */}
          <div className="hidden md:block relative">
            {/* Horizontal line */}
            <div className="absolute top-12 left-0 w-full h-px bg-border"></div>

            <div className="flex justify-between">
              {roadmapData.map((item, index) => (
                <div
                  key={index}
                  className="relative w-1/4 px-4 text-center"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {/* Timeline dot */}
                  <div
                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 cursor-pointer
                      ${
                        activeIndex === index
                          ? `bg-primary shadow-sm scale-105 text-primary-foreground` // Use primary for active
                          : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/50" // Use card/border/muted for inactive
                      }`}
                  >
                    {item.icon}
                  </div>

                  <div
                    className={`transition-all duration-300 ${
                      activeIndex === index ? "transform -translate-y-1" : ""
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2
                      ${
                        activeIndex === index
                          ? "bg-primary text-primary-foreground" // Use primary for active
                          : "bg-muted text-muted-foreground" // Use muted for inactive
                      }`}
                    >
                      {item.timeline}
                    </span>
                    <h3 className="text-lg font-medium text-foreground">
                      {item.title}
                    </h3>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeIndex === index
                          ? "max-h-20 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 h-full w-px bg-border"></div>

            <div className="space-y-12">
              {roadmapData.map((item, index) => (
                <div
                  key={index}
                  className="relative pl-16"
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? null : index)
                  }
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${
                        activeIndex === index
                          ? "bg-primary shadow-sm scale-105 text-primary-foreground" // Use primary for active
                          : "bg-card border border-border text-muted-foreground" // Use card/border/muted for inactive
                      }`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2
                      ${
                        activeIndex === index
                          ? "bg-primary text-primary-foreground" // Use primary for active
                          : "bg-muted text-muted-foreground" // Use muted for inactive
                      }`}
                    >
                      {item.timeline}
                    </span>
                    <h3 className="text-lg font-medium text-foreground">
                      {item.title}
                    </h3>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeIndex === index
                          ? "max-h-20 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
