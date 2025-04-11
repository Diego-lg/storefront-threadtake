"use client";

import Image from "next/image";
import Link from "next/link"; // Added import
import {
  motion,
  useAnimation,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import { Sparkles, Zap, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button"; // Corrected to named import
import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// Animation variants moved outside component to prevent recreation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 2, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  },
};

const textRevealVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Product data moved outside to prevent recreation
const PRODUCT_DATA = [
  {
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80",
    name: "Geometric Essence",
    price: "$49.00",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1969&q=80",
    name: "Cosmic Minimalist",
    price: "$59.00",
  },
  {
    image:
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    name: "Abstract Flow",
    price: "$54.00",
  },
];

function Hero() {
  // Only keep necessary state variables
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeImage, setActiveImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const buttonControls = useAnimation();
  const heroRef = useRef<HTMLDivElement>(null);

  // Motion values for cursor
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSize = useMotionValue(16);
  const cursorOpacity = useMotionValue(0);

  // Mouse event handler with useCallback
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (heroRef.current) {
        const { left, top, width, height } =
          heroRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setMousePosition({ x, y });

        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    },
    [cursorX, cursorY]
  );

  // Handle mouse enter/leave with useCallback
  const handleMouseEnter = useCallback(() => {
    cursorOpacity.set(1);
  }, [cursorOpacity]);

  const handleMouseLeave = useCallback(() => {
    cursorOpacity.set(0);
  }, [cursorOpacity]);

  // Optimize event listeners with cleanup
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseenter", handleMouseEnter);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  // Image carousel effect
  useEffect(() => {
    if (isHovering) return;

    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % PRODUCT_DATA.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovering]);

  // Button hover effect
  useEffect(() => {
    buttonControls.start({
      scale: isHovering ? 1.05 : 1,
      transition: { duration: 0.3 },
    });
  }, [isHovering, buttonControls]);

  // Memoize handlers to reduce re-renders
  const handleImageHover = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleImageLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleButtonEnter = useCallback(() => {
    setIsHovering(true);
    cursorSize.set(80);
  }, [cursorSize]);

  const handleButtonLeave = useCallback(() => {
    setIsHovering(false);
    cursorSize.set(16);
  }, [cursorSize]);

  // Memoize current product data
  const currentProduct = useMemo(
    () => PRODUCT_DATA[activeImage],
    [activeImage]
  );

  return (
    <div
      ref={heroRef}
      className="relative overflow-hidden min-h-screen flex items-center"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Dynamic gradient background */}

        {/* Subtle grid */}
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDUpIj48cGF0aCBkPSJNMCAyMGgyMFYwSDB6Ii8+PC9nPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIj48cGF0aCBkPSJNMCAyMGgyMFYwSDB6Ii8+PC9nPjwvc3ZnPg==')] bg-repeat"
          style={{
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Main content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          {/* Text content */}
          <motion.div className="space-y-8">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" // Changed badge style
            >
              <Sparkles className="h-4 w-4 text-black dark:text-white" />{" "}
              {/* Changed icon color */}
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {" "}
                {/* Changed text color */}
                New Collection
              </span>
            </motion.div>

            <div className="space-y-2">
              {["Minimal.", "Thoughtful. Design."].map((line, i) => (
                <motion.h1
                  key={i}
                  custom={i}
                  variants={textRevealVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-black dark:text-white" // Changed heading color
                >
                  {i === 0 ? (
                    <span>{line}</span>
                  ) : (
                    <span>
                      <span className="text-black dark:text-white">
                        Thoughtful.
                      </span>{" "}
                      Design. {/* Changed highlight color */}
                    </span>
                  )}
                </motion.h1>
              ))}
            </div>

            <motion.p
              variants={itemVariants}
              className="text-lg text-neutral-700 dark:text-neutral-300 max-w-md leading-relaxed" // Changed paragraph color
            >
              Curated collection of AI-generated designs that blend minimalism
              with personal expression. Each piece tells a story.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-2"
            >
              <motion.div
                onMouseEnter={handleButtonEnter}
                onMouseLeave={handleButtonLeave}
                animate={buttonControls}
              >
                {/* Primary Button: Black in light mode, White in dark mode */}
                <Button className="rounded-full px-8 py-6 bg-black text-white dark:bg-white dark:text-black transition-colors relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-2 text-base">
                    <span>Shop Collection</span>
                    <Zap className="h-5 w-5" />
                  </span>
                  {/* Removed gradient span */}
                </Button>
              </motion.div>

              <Link href="/generator">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Secondary Button: Transparent with border */}
                  <Button className="rounded-full px-8 py-6 bg-transparent border border-black text-black dark:border-white dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-base group relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      <span>Design Your Own</span>
                      <MousePointerClick className="h-5 w-5" />
                    </span>
                    {/* Removed gradient span */}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Visual content */}
          <motion.div
            variants={itemVariants}
            className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0"
            onMouseEnter={handleImageHover}
            onMouseLeave={handleImageLeave}
          >
            <div className="relative h-full w-full">
              {/* 3D-like floating display with image carousel */}
              <motion.div
                className="absolute inset-0"
                style={{
                  perspective: "1000px",
                  perspectiveOrigin: `${50 + mousePosition.x * 10}% ${
                    50 + mousePosition.y * 10
                  }%`,
                }}
              >
                {/* Main featured product with image carousel */}
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_50px_rgba(255,255,255,0.1)]" // Adjusted shadow for B&W
                  style={{
                    transform: `rotateY(${mousePosition.x * 10}deg) rotateX(${
                      -mousePosition.y * 10
                    }deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={currentProduct.image}
                        alt={`Design ${currentProduct.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority={activeImage === 0}
                        quality={85}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Product info overlay */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-6 text-white"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {/* Kept text white as it's an overlay on the image */}
                    <motion.div
                      className="text-xs font-semibold text-white mb-1" // Changed color
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Featured Design
                    </motion.div>
                    <motion.div
                      className="text-xl font-bold"
                      key={`name-${activeImage}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentProduct.name}
                    </motion.div>
                    <motion.div
                      className="text-white/80 mt-1"
                      key={`price-${activeImage}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {currentProduct.price}
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Image navigation dots */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {PRODUCT_DATA.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        // Changed dot colors
                        activeImage === index
                          ? "bg-black dark:bg-white" // Active dot
                          : "bg-neutral-300 dark:bg-neutral-700" // Inactive dot
                      }`}
                      onClick={() => setActiveImage(index)}
                      whileHover={{ scale: 1.5 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Decorative elements */}
              {/* Removed extra motion.div wrapper */}
              {/* Decorative Circle 1 - Removed color animation, adjusted border */}
              <motion.div
                className="absolute -z-10 -top-6 -left-6 w-24 h-24 rounded-full border border-neutral-300 dark:border-neutral-700"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              {/* Removed extra motion.div wrapper */}
              {/* Decorative Circle 2 - Removed color animation, adjusted border */}
              <motion.div
                className="absolute -z-10 -bottom-10 right-10 w-16 h-16 rounded-full border border-neutral-300 dark:border-neutral-700"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Minimal footer info */}
      {/* Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8 text-xs text-neutral-600 dark:text-neutral-400">
        {" "}
        {/* Changed footer text color */}
        <div className="flex-1"></div>
        <div className="flex items-center gap-6">
          {["Premium materials", "Limited editions", "Free shipping"].map(
            (text, i) => (
              <motion.span
                key={i}
                whileHover={{
                  color: "black", // Use direct color for light mode hover
                  y: -2,
                }}
                className="dark:hover:text-white" // Add specific dark mode hover color class
                transition={{ duration: 0.2 }}
              >
                {text}
              </motion.span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;
