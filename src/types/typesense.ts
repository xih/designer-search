// TypeScript interfaces matching your Typesense collection schema

/**
 * Main profile hit interface - matches your Typesense collection schema exactly
 */
export interface ProfileHit {
  id: string;
  name: string;
  username: string;
  title: string;
  about: string;
  location: string;
  website: string;
  profilePhotoUrl: string; // Profile photo URL (matches your backend)
  contact_email: string; // Contact email address
  linkedin_url: string; // LinkedIn profile URL
  twitter_url: string; // Twitter/X profile URL
  github_url: string; // GitHub profile URL
  skills: string[]; // string[], facet: true
  job_titles: string[]; // string[], facet: true
  companies: string[]; // string[], facet: true
  schools: string[]; // string[], facet: true
  project_names: string[]; // string[], facet: true
  projects_text: string;
  experience_text: string;
  education_text: string;
  fulltext: string;
  searchable_text: string;
  embedding: number[]; // float[], 768 dimensions
  profile_created_at: number; // int64, sort: true
  followers_count: number; // int32, sort: true
  indexed_at: number; // int64, sort: true
}

/**
 * Optional fields version for more flexible usage
 * Use this when some fields might be missing in search results
 */
export interface ProfileHitOptional {
  id: string;
  name: string;
  username: string;
  title?: string;
  about?: string;
  location?: string;
  website?: string;
  profilePhotoUrl?: string; // Profile photo URL (matches your backend)
  contact_email?: string; // Contact email address
  linkedin_url?: string; // LinkedIn profile URL
  twitter_url?: string; // Twitter/X profile URL
  github_url?: string; // GitHub profile URL
  skills?: string[];
  job_titles?: string[];
  companies?: string[];
  schools?: string[];
  project_names?: string[];
  projects_text?: string;
  experience_text?: string;
  education_text?: string;
  fulltext?: string;
  searchable_text?: string;
  embedding?: number[];
  profile_created_at?: number;
  followers_count?: number;
  indexed_at?: number;
}

/**
 * Typesense collection schema (for reference and validation)
 * This mirrors your Python schema exactly
 */
export const PROFILE_COLLECTION_SCHEMA = {
  name: "profiles", // or whatever your collection_name is
  enable_nested_fields: true,
  fields: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "username", type: "string" },
    { name: "title", type: "string" },
    { name: "about", type: "string" },
    { name: "location", type: "string" },
    { name: "website", type: "string" },
    { name: "profilePhotoUrl", type: "string" }, // Profile photo URL
    { name: "contact_email", type: "string" }, // Contact email
    { name: "linkedin_url", type: "string" }, // LinkedIn URL
    { name: "twitter_url", type: "string" }, // Twitter URL
    { name: "github_url", type: "string" }, // GitHub URL
    { name: "skills", type: "string[]", facet: true },
    { name: "job_titles", type: "string[]", facet: true },
    { name: "companies", type: "string[]", facet: true },
    { name: "schools", type: "string[]", facet: true },
    { name: "project_names", type: "string[]", facet: true },
    { name: "projects_text", type: "string" },
    { name: "experience_text", type: "string" },
    { name: "education_text", type: "string" },
    { name: "fulltext", type: "string" },
    { name: "searchable_text", type: "string" },
    { name: "embedding", type: "float[]", num_dim: 768 },
    { name: "profile_created_at", type: "int64", sort: true },
    { name: "followers_count", type: "int32", sort: true },
    { name: "indexed_at", type: "int64", sort: true },
  ],
  default_sorting_field: "indexed_at",
} as const;

/**
 * Facetable fields - useful for creating filters
 */
export const FACETABLE_FIELDS = [
  "skills",
  "job_titles",
  "companies",
  "schools",
  "project_names",
] as const;

/**
 * Sortable fields - useful for sorting options
 */
export const SORTABLE_FIELDS = [
  "profile_created_at",
  "followers_count",
  "indexed_at",
] as const;

/**
 * Searchable text fields - useful for query_by parameter
 */
export const SEARCHABLE_FIELDS = [
  "name",
  "username",
  "title",
  "about",
  "location",
  "skills",
  "job_titles",
  "companies",
  "schools",
  "project_names",
  "projects_text",
  "experience_text",
  "education_text",
  "fulltext",
  "searchable_text",
] as const;
