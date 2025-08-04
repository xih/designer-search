// Hit Component Examples - Different structures for different data types

import React from "react";
import Image from "next/image";

// =============================================================================
// EXAMPLE 1: Basic Product Hit (E-commerce)
// =============================================================================

interface ProductHit {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  categories?: string[];
  rating?: number;
  reviews_count?: number;
  brand?: string;
  in_stock?: boolean;
}

function ProductHitComponent({ hit }: { hit: ProductHit }) {
  return (
    <div className="flex rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Product Image */}
      {hit.image && (
        <div className="mr-4 flex-shrink-0">
          <Image
            src={hit.image}
            alt={hit.name}
            className="h-24 w-24 rounded-lg object-cover"
          />
        </div>
      )}

      {/* Product Details */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{hit.name}</h3>
            {hit.brand && (
              <p className="text-sm text-gray-500">by {hit.brand}</p>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-xl font-bold text-green-600">
              {hit.currency ?? "$"}
              {hit.price}
            </p>
            {/* Stock Status */}
            <span
              className={`rounded px-2 py-1 text-xs ${
                hit.in_stock
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {hit.in_stock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        {/* Description */}
        {hit.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {hit.description}
          </p>
        )}

        {/* Rating */}
        {hit.rating && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i: number) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(hit.rating!)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-sm text-gray-500">
                ({hit.reviews_count ?? 0} reviews)
              </span>
            </div>
          </div>
        )}

        {/* Categories */}
        {hit.categories && hit.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hit.categories.map((category, index) => (
              <span
                key={index}
                className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: User Profile Hit (People Directory)
// =============================================================================

interface UserProfileHit {
  name: string;
  about?: string;
  avatar?: string;
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  contact_email?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

function UserProfileHitComponent({ hit }: { hit: UserProfileHit }) {
  return (
    <div className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {hit.avatar ? (
            <img
              src={hit.avatar}
              alt={hit.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <span className="text-xl font-semibold text-gray-600">
                {hit.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {hit.name}
              </h3>
              {hit.title && (
                <p className="text-sm font-medium text-gray-600">{hit.title}</p>
              )}
              {hit.company && (
                <p className="text-sm text-gray-500">at {hit.company}</p>
              )}
              {hit.location && (
                <p className="text-sm text-gray-500">📍 {hit.location}</p>
              )}
            </div>

            {/* Contact Button */}
            {hit.contact_email && (
              <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                Contact
              </button>
            )}
          </div>

          {/* About */}
          {hit.about && (
            <p className="mt-3 line-clamp-3 text-sm text-gray-600">
              {hit.about}
            </p>
          )}

          {/* Skills */}
          {hit.skills && hit.skills.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Skills:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="rounded bg-green-100 px-2 py-1 text-xs text-green-800"
                  >
                    {skill}
                  </span>
                ))}
                {hit.skills.length > 5 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {hit.social_links && (
            <div className="mt-4 flex space-x-3">
              {hit.social_links.linkedin && (
                <a
                  href={hit.social_links.linkedin}
                  className="text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              )}
              {hit.social_links.twitter && (
                <a
                  href={hit.social_links.twitter}
                  className="text-blue-400 hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              )}
              {hit.social_links.github && (
                <a
                  href={hit.social_links.github}
                  className="text-gray-700 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Article/Blog Post Hit (Content)
// =============================================================================

interface ArticleHit {
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  published_date?: string;
  read_time?: number;
  tags?: string[];
  category?: string;
  featured_image?: string;
  url?: string;
}

function ArticleHitComponent({ hit }: { hit: ArticleHit }) {
  return (
    <article className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Featured Image */}
      {hit.featured_image && (
        <div className="mb-4">
          <Image
            src={hit.featured_image}
            alt={hit.title}
            className="h-48 w-full rounded-lg object-cover"
          />
        </div>
      )}

      {/* Article Header */}
      <div className="mb-3">
        {hit.category && (
          <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
            {hit.category}
          </span>
        )}
        <h2 className="mt-2 line-clamp-2 text-xl font-bold text-gray-900">
          {hit.title}
        </h2>
      </div>

      {/* Article Meta */}
      <div className="mb-3 flex items-center space-x-4 text-sm text-gray-500">
        {hit.author && <span>By {hit.author}</span>}
        {hit.published_date && (
          <span>{new Date(hit.published_date).toLocaleDateString()}</span>
        )}
        {hit.read_time && <span>{hit.read_time} min read</span>}
      </div>

      {/* Excerpt */}
      {hit.excerpt && (
        <p className="mb-4 line-clamp-3 text-gray-600">{hit.excerpt}</p>
      )}

      {/* Tags */}
      {hit.tags && hit.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {hit.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Read More Link */}
      {hit.url && (
        <div className="flex items-center justify-between">
          <a
            href={hit.url}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            Read more →
          </a>
        </div>
      )}
    </article>
  );
}

// =============================================================================
// EXAMPLE 4: Minimal/Card Hit (General Purpose)
// =============================================================================

interface MinimalHit {
  title: string;
  description?: string;
  metadata?: Record<string, string>;
  url?: string;
  type?: string;
}

function MinimalHitComponent({ hit }: { hit: MinimalHit }) {
  return (
    <div className="group rounded-lg border p-4 transition-all hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            {hit.title}
          </h3>
          {hit.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {hit.description}
            </p>
          )}

          {/* Dynamic Metadata */}
          {hit.metadata && Object.keys(hit.metadata).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(hit.metadata).map(([key, value]) => (
                <div key={key} className="flex text-xs text-gray-500">
                  <span className="font-medium capitalize">{key}:</span>
                  <span className="ml-1">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Type Badge */}
        {hit.type && (
          <span className="ml-3 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {hit.type}
          </span>
        )}
      </div>

      {/* Action Link */}
      {hit.url && (
        <div className="mt-3">
          <a
            href={hit.url}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View Details →
          </a>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HOW TO USE THESE EXAMPLES
// =============================================================================

/*

To use any of these Hit components in your TypesenseSearch:

1. Copy the Hit component you want to use
2. Update the SearchHit interface to match your data structure
3. Replace the Hit component in TypesenseSearch.tsx

Example:
```tsx
// In TypesenseSearch.tsx, replace the Hit function with:
function Hit({ hit }: { hit: ProductHit }) {
  return <ProductHitComponent hit={hit} />;
}
```

Or import and use directly:
```tsx
import { ProductHitComponent } from './HitExamples';

// In your search component:
<Hits hitComponent={({ hit }) => <ProductHitComponent hit={hit} />} />
```

You can also create conditional rendering based on hit type:
```tsx
function Hit({ hit }: { hit: SearchHit }) {
  switch (hit.type) {
    case 'product':
      return <ProductHitComponent hit={hit as ProductHit} />;
    case 'user':
      return <UserProfileHitComponent hit={hit as UserProfileHit} />;
    case 'article':
      return <ArticleHitComponent hit={hit as ArticleHit} />;
    default:
      return <MinimalHitComponent hit={hit as MinimalHit} />;
  }
}
```

*/
