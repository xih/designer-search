"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function HeaderWithSearch({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAboutPage = pathname === "/about";

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="cursor-pointer text-lg font-semibold text-black transition-all duration-200 hover:scale-105 hover:text-gray-700 md:text-xl"
            style={{
              fontFamily: "Cardinal Photo, sans-serif",
            }}
          >
            ReadCV Search
          </Link>

          <Link
            href="/about"
            className={`text-base font-medium transition-all duration-200 md:text-lg ${
              isAboutPage
                ? "cursor-default text-black"
                : "cursor-pointer text-gray-600 hover:scale-105 hover:text-black"
            }`}
            style={{
              fontFamily: "Cardinal Photo, sans-serif",
            }}
          >
            About
          </Link>
        </div>
      </div>
      
      {/* Search Section - Below Header */}
      {children && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}