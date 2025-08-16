"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAboutPage = pathname === "/about";

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // If on another page, navigate to home
      router.push("/");
    }
  };

  return (
    <header className="relative border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        {/* Left side - ReadCV Search logo/home link */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="cursor-pointer text-lg font-semibold text-black transition-colors duration-200 hover:text-gray-700 md:text-xl"
          style={{
            fontFamily: "Cardinal Photo, sans-serif",
          }}
        >
          ReadCV Search
        </Link>

        {/* Right side - About link */}
        <Link
          href="/about"
          className={`text-base font-medium transition-all duration-200 md:text-lg ${
            isAboutPage
              ? "cursor-default text-black"
              : "cursor-pointer text-gray-600 hover:text-black"
          }`}
          style={{
            fontFamily: "Cardinal Photo, sans-serif",
          }}
        >
          About
        </Link>
      </div>
    </header>
  );
}
