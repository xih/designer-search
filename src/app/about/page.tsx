"use client";

import React from "react";
import Link from "next/link";
import { Header } from "~/components/Header";

export default function AboutPage() {
  return (
    <div
      className="relative min-h-screen bg-white"
      style={{
        fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
      }}
    >
      <Header />

      {/* Main content */}
      <div className="relative z-10 pt-4 font-thin">
        <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
          {/* Headline */}
          <h1
            className="mb-12 text-center text-xl font-bold text-black md:text-2xl lg:text-4xl"
            style={{
              fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
            }}
          >
            The origins of ReadCV Search
          </h1>

          {/* Body content */}
          <div
            className="prose prose-lg md:prose-xl max-w-none font-normal leading-relaxed text-gray-700"
            style={{
              fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
            }}
          >
            <p className="mb-4 text-lg font-thin leading-relaxed text-gray-700 md:text-2xl">
              In the fast-paced world of design and technology, finding the
              right talent has always been like searching for a needle in a
              haystack. Traditional platforms were slow, cluttered, and simply
              weren&apos;t built for the modern creative professional. When
              ReadCV announced that they were shutting down, I knew I had to do
              something. This was one of the best communities in the entire
              world for high quality craft and design.
            </p>

            <p className="mb-4 text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              ReadCV Search was born from a simple frustration: why should it
              take hours to find a designer when it could take milliseconds? I
              wanted to create something that felt as fast and intuitive as the
              creative process itself.
            </p>

            <p className="mb-8 text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              Starting with a database of talented designers from top companies
              like Apple, Google, Meta, and countless innovative startups, we
              built a search experience that prioritizes speed, accuracy, and
              discovery. Every query is powered by advanced search technology
              that understands not just what you&apos;re looking for, but what
              you might discover along the way.
            </p>

            <p className="mb-8 text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              Our mission is simple: make finding exceptional design talent as
              effortless as possible. Whether you&apos;re a startup looking for
              your first designer, a growing company building a team, or a
              creative professional seeking inspiration from peers, ReadCV
              Search connects you with the right people at the speed of thought.
            </p>

            <p className="mb-8 text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              This is just the beginning. We&apos;re constantly evolving,
              constantly improving, and constantly amazed by the incredible
              talent in our design community. Welcome to the future of design
              talent discovery.
            </p>

            <p className="mb-8 text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              Thank you to{" "}
              <Link
                href="twitter.com/"
                className="cursor-pointer underline decoration-gray-400 underline-offset-2 transition-all duration-200 hover:text-gray-900 hover:decoration-gray-600"
                target="_blank"
              >
                Andy Chung
              </Link>{" "}
              and{" "}
              <Link
                href="https://x.com/mehdimulani"
                className="cursor-pointer underline decoration-gray-400 underline-offset-2 transition-all duration-200 hover:text-gray-900 hover:decoration-gray-600"
                target="_blank"
              >
                Mehdi
              </Link>{" "}
              for building the ReadCV community. With gratitude, this is for all
              the designers out there who see this as one of the best
              communities in the world.
            </p>

            <p className="text-lg font-thin leading-relaxed text-gray-700 md:text-xl">
              Built by
              <span> </span>
              <Link
                href="https://twitter.com/capitalizedtime"
                className="cursor-pointer underline decoration-gray-400 underline-offset-2 transition-all duration-200 hover:text-gray-900 hover:decoration-gray-600"
                target="_blank"
              >
                Capitalized Time
              </Link>
            </p>
          </div>

          {/* Call to action */}
          {/* <div className="mt-16 text-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-black px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-gray-800"
              style={{
                fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
              }}
            >
              Start Searching
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
