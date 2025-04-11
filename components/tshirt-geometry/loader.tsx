import React from "react";
import { Html } from "@react-three/drei";

export function Loader() {
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    </Html>
  );
}
