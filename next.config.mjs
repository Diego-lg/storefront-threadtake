const nextConfig = {
  // Keep existing headers configuration if it was present before
  // async headers() {
  //   return [
  //     {
  //       // matching all API routes
  //       source: "/api/:path*",
  //       headers: [
  //         { key: "Access-Control-Allow-Credentials", value: "true" },
  //         {
  //           key: "Access-Control-Allow-Origin",
  //           value: "http://localhost:3001", // frontend origin - ADJUST IF NEEDED
  //         },
  //         {
  //           key: "Access-Control-Allow-Methods",
  //           value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
  //         },
  //         {
  //           key: "Access-Control-Allow-Headers",
  //           value:
  //             "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  //         },
  //       ],
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Keep existing Cloudinary
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Keep existing Unsplash
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-167bcbb6797c48d686d7dacfba94f17f.r2.dev", // Add R2 hostname
        port: "",
        pathname: "/**",
      },
    ],
  },
  /* other config options might be here */
};

export default nextConfig;
