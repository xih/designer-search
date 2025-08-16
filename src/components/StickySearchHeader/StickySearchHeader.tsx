"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { DebouncedSearchBox } from "../ProfileSearchClient";
import { QuickFilterTabs } from "../QuickFilterTabs";

interface StickySearchHeaderProps {
  placeholder: string;
  statsRef: React.RefObject<HTMLDivElement>;
}

export function StickySearchHeader({
  placeholder,
  statsRef,
}: StickySearchHeaderProps) {
  const { scrollY } = useScroll();

  // ANIMATION TIMING CONFIGURATION:
  // Adjust these values to change when the animation starts and ends
  const SCROLL_START = 50; // Animation starts after scrolling 50px
  const SCROLL_END = 200; // Animation completes at 200px

  // Transform for container width animation
  // To change easing, you can use a custom function instead of linear interpolation
  const containerMaxWidth = useTransform(
    scrollY,
    [SCROLL_START, SCROLL_END], // Input range: when to start and end animation
    ["42rem", "100%"], // Output range: from narrow to full width
    {
      // EASING OPTIONS (uncomment one):
      // ease: "linear" // Default linear interpolation
      // ease: "easeOut" // Starts fast, ends slow
      // ease: "easeIn" // Starts slow, ends fast
      // ease: "easeInOut" // Slow at both ends
      // ease: [0.4, 0.0, 0.2, 1] // Custom cubic-bezier values
    },
  );

  const containerPadding = useTransform(
    scrollY,
    [SCROLL_START, SCROLL_END],
    ["0rem", "1rem"],
  );

  return (
    <motion.div
      className="sticky top-0 z-40 bg-white pointer-events-none"
      initial={{ y: 0 }}
      style={{}}
    >
      {/* Mobile: Always full width with padding */}
      <div className="block w-full px-4 sm:hidden pointer-events-auto">
        <div className="pb-4 pt-4">
          <DebouncedSearchBox placeholder={placeholder} />
        </div>
      </div>

      {/* Desktop: Animated width container */}
      <motion.div
        className="mx-auto hidden transition-all sm:block pointer-events-auto"
        style={{
          maxWidth: containerMaxWidth,
          paddingLeft: containerPadding,
          paddingRight: containerPadding,
        }}
      >
        <div className="px-0 pb-4 pt-4">
          <DebouncedSearchBox placeholder={placeholder} />
        </div>
      </motion.div>
      {/* Quick Filter Tabs with reduced bottom margin */}
      <div className="pb-2 pointer-events-auto">
        <QuickFilterTabs statsRef={statsRef} />
      </div>
    </motion.div>
  );
}
