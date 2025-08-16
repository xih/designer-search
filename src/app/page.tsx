"use client";

import React from "react";
import ProfileSearch from "~/components/ProfileSearch";
import { Header } from "~/components/Header";

export default function HomePage() {
  return (
    <div className="relative">
      <Header />
      {/* Main content */}
      <div className="relative pt-20">
        <div className="my-16 px-4 md:my-36">
          <h1
            className="text-center text-8xl font-bold text-black sm:text-7xl md:text-8xl lg:text-9xl"
            style={{ fontFamily: "Cardinal Photo, sans-serif" }}
          >
            ReadCV Search
          </h1>
          <p
            className="mt-2 text-center text-xl font-light text-gray-300 sm:text-2xl md:text-4xl"
            style={{ fontFamily: "Cardinal Photo, sans-serif" }}
          >
            Find your favorite designers in milliseconds
          </p>
        </div>

        <ProfileSearch
          showFilters={true}
          placeholder="Search by name, skills, company, or location..."
          className="max-w-7xl"
        />
      </div>
    </div>
  );
}
