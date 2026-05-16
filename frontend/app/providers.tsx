"use client";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <Toaster position="top-right" />
      {children}
    </HeroUIProvider>
  );
}
