"use client";

import React from "react";
import ProfileSearch from "~/components/ProfileSearch";
import { ProfileHitDemo } from "~/components/ProfileHitDemo";
import { RealDataDemo } from "~/components/RealDataDemo";

export default function SearchPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-center text-3xl font-bold">Profile Search</h1>
        <p className="mt-2 text-center text-gray-600">
          Find professionals, their skills, and connect with them
        </p>
      </div>

      {/* Real data demo */}
      {/* <div className="mb-12">
        <RealDataDemo />
      </div> */}

      {/* Demo section to show enhanced profile cards */}
      {/* <div className="mb-12">
        <ProfileHitDemo />
      </div> */}

      <ProfileSearch
        showFilters={true}
        placeholder="Search by name, skills, company, or location..."
        className="max-w-7xl"
      />
    </div>
  );
}
