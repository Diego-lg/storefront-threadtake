import RegisterForm from "@/components/auth/RegisterForm"; // We'll create this component next

import { Suspense } from "react";
import ShowcaseVideo from "@/components/start_video";

export default function RegisterPage() {
  return (
    <div className="relative flex h-[94vh]  max-h-full w-full items-center justify-center overflow-hidden bg-black text-white">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="noise h-full w-full"></div>
      </div>

      {/* Gradient elements */}
      <div className="absolute left-0 top-0 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-[0.03] blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 h-[80vh] w-[80vh] translate-x-1/2 translate-y-1/2 rounded-full bg-white opacity-[0.03] blur-[100px]"></div>

      {/* Grid pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02]">
        <div className="grid-lines h-full w-full"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-12 lg:flex-row lg:items-stretch lg:gap-8">
          {/* Left side - Video showcase */}
          <div className="w-full max-w-2xl lg:w-3/5">
            <div className="overflow-hidden border border-white/10">
              <ShowcaseVideo />
            </div>
            <div className="mt-6 flex flex-col items-center">
              <h1 className="font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
                MONO<span className="font-bold">CHROME</span>
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-white/60">
                Timeless Elegance
              </p>
              <div className="mt-4 h-px w-12 bg-white/20"></div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="w-full max-w-md lg:w-2/5">
            <div className="overflow-hidden border border-white/10 bg-black/30 p-8 backdrop-blur-sm">
              <div className="mb-8 text-center">
                <h2 className="text-xl font-light uppercase tracking-widest text-white">
                  Register
                </h2>
                <div className="mt-2 flex justify-center">
                  <div className="h-px w-12 bg-white/20"></div>
                </div>
              </div>

              <Suspense fallback={<RegisterFormSkeleton />}>
                <RegisterForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-20 rounded-none bg-white/10"></div>
        <div className="h-12 w-full rounded-none bg-white/10"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-20 rounded-none bg-white/10"></div>
        <div className="h-12 w-full rounded-none bg-white/10"></div>
      </div>
      <div className="h-12 w-full rounded-none bg-white/20"></div>
      <div className="h-px w-full bg-white/10"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 w-full rounded-none bg-white/10"></div>
        <div className="h-12 w-full rounded-none bg-white/10"></div>
      </div>
    </div>
  );
}
