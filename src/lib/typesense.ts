import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { SEARCHABLE_FIELDS } from "~/types/typesense";

// 🧪 PERFORMANCE OPTIMIZATION FLAGS - Toggle these to test different performance levels
const USE_MINIMAL_CONFIG = true; // Start with this for maximum performance
const REDUCE_PER_PAGE = false; // Only use if minimal config is too restrictive
const DISABLE_EXHAUSTIVE = false; // Only use if minimal config is too restrictive
const MINIMAL_FIELDS = false; // Only use if minimal config is too restrictive
const REDUCE_MAX_HITS = false; // Only use if minimal config is too restrictive

// MINIMAL CONFIG: Ultra-fast like GitHub examples
const createMinimalAdapter = () => {
  console.log("🚀 [TYPESENSE] Using MINIMAL ultra-fast configuration");
  return new TypesenseInstantSearchAdapter({
    server: {
      apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2!,
      nodes: [
        {
          host: process.env.NEXT_PUBLIC_TYPESENSE_HOST2!,
          port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT2!),
          path: process.env.NEXT_PUBLIC_TYPESENSE_PATH2 ?? "",
          protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2!,
        },
      ],
      cacheSearchResultsForSeconds: 2 * 60,
      connectionTimeoutSeconds: 5, // Faster timeout for responsiveness
      timeoutSeconds: 5,
    },
    geoLocationField: "lat_lng_field",
    additionalSearchParameters: {
      query_by: "name,title,about,skills,companies,location", // Essential fields only
      per_page: 50, // Much smaller page size for faster initial load
      max_hits: 1000, // Much smaller max hits for faster search
      // No exhaustive_search - faster but less comprehensive
      include_fields:
        "id,name,username,title,about,location,website,profilePhotoUrl,photourl,contact_email,linkedin_url,github_url,skills,companies,lat_lng_field,followers_count", // Essential fields only
    },
  });
};

// OPTIMIZED CONFIG: Balance between performance and features
const createOptimizedAdapter = () => {
  console.log("🚀 [TYPESENSE] Using OPTIMIZED configuration");

  const config = {
    server: {
      apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2!,
      nodes: [
        {
          host: process.env.NEXT_PUBLIC_TYPESENSE_HOST2!,
          port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT2!),
          path: process.env.NEXT_PUBLIC_TYPESENSE_PATH2 ?? "",
          protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2!,
        },
      ],
      cacheSearchResultsForSeconds: 2 * 60,
      connectionTimeoutSeconds: REDUCE_MAX_HITS ? 5 : 15,
      timeoutSeconds: REDUCE_MAX_HITS ? 5 : 15,
    },
    geoLocationField: "lat_lng_field",
    additionalSearchParameters: {
      query_by: SEARCHABLE_FIELDS.join(","),
      per_page: REDUCE_PER_PAGE ? 100 : 1000,
      max_hits: REDUCE_MAX_HITS ? 1000 : 10000,
      limit_hits: REDUCE_MAX_HITS ? 1000 : 10000,
      ...(DISABLE_EXHAUSTIVE ? {} : { exhaustive_search: true }),
      include_fields: MINIMAL_FIELDS
        ? "id,name,username,title,about,location,website,profilePhotoUrl,photourl,contact_email,linkedin_url,github_url,skills,companies,lat_lng_field,followers_count"
        : "id,name,username,title,about,location,website,profilePhotoUrl,photourl,opengraphimageurl,contact_email,linkedin_url,twitter_url,github_url,skills,job_titles,companies,schools,project_names,projects_text,experience_text,education_text,fulltext,searchable_text,embedding,lat_lng_field,profile_created_at,followers_count,indexed_at",
    },
  };

  console.log("🧪 [TYPESENSE] Active optimizations:", {
    reducedPerPage: REDUCE_PER_PAGE ? "50 (vs 1000)" : "disabled",
    disableExhaustive: DISABLE_EXHAUSTIVE ? "disabled" : "enabled",
    minimalFields: MINIMAL_FIELDS ? "essential only" : "all fields",
    reducedMaxHits: REDUCE_MAX_HITS ? "1000 (vs 10000)" : "disabled",
  });

  return new TypesenseInstantSearchAdapter(config);
};

// Choose configuration based on flags
const getAdapter = () => {
  if (USE_MINIMAL_CONFIG) {
    return createMinimalAdapter();
  }
  return createOptimizedAdapter();
};

export const searchClient = getAdapter().searchClient;
