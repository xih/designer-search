"use client";

import React from "react";
import ProfileSearch from "~/components/ProfileSearch";

export default function SearchPage() {
  return (
    <div>
      <div className="my-36">
        <h1
          className="text-center text-9xl font-bold"
          style={{ fontFamily: "Cardinal Photo, sans-serif" }}
        >
          ReadCV Search
        </h1>
        <p
          className="mt-2 text-center text-4xl text-gray-600"
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
