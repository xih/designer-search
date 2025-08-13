"use client";

import React from "react";
import ProfileSearch from "~/components/ProfileSearch";

export default function HomePage() {
  return (
    <div>
      <div className="my-16 px-4 md:my-36">
        <h1
          className="text-center text-8xl font-bold text-black sm:text-7xl md:text-8xl lg:text-9xl"
          style={{ fontFamily: "Cardinal Photo, sans-serif" }}
        >
          ReadCV Search
        </h1>
        <p
          className="mt-2 text-center text-xl text-gray-600 sm:text-2xl md:text-4xl"
          style={{ fontFamily: "Cardinal Photo, sans-serif" }}
        >
          &quot;Find my&quot; Designers
        </p>
      </div>

      <ProfileSearch
        showFilters={true}
        placeholder="Search by name, skills, company, or location..."
        className="max-w-7xl"
      />
    </div>
  );
}