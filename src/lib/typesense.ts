import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { SEARCHABLE_FIELDS } from "~/types/typesense";

const typesenseInstantSearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY!, // Be sure to use an API key that only allows search operations
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
        port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT!),
        path: process.env.NEXT_PUBLIC_TYPESENSE_PATH ?? "", // Optional. Example: If you have your typesense mounted in localhost:8108/typesense, path should be equal to '/typesense'
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL!,
      },
    ],
    cacheSearchResultsForSeconds: 2 * 60, // Cache search results from server. Defaults to 2 minutes. Set to 0 to disable caching.
  },
  // The following parameters are directly passed to Typesense's search API endpoint.
  //  So you can pass any parameters supported by the search endpoint below.
  //  query_by is required.
  additionalSearchParameters: {
    query_by:
      process.env.NEXT_PUBLIC_TYPESENSE_QUERY_BY ?? SEARCHABLE_FIELDS.join(","),
    per_page: 250,
    max_hits: 10000,
    limit_hits: 10000,
    exhaustive_search: true,
  },
});

// Try to use adapter2 first (with *2 env vars), fallback to adapter1
const getTypesenseAdapter = () => {
  // Check if *2 environment variables are available
  const hasAdapter2Config =
    process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_HOST2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_PORT2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2;

  if (hasAdapter2Config) {
    console.log("🚀 Using Typesense Adapter 2 (with *2 env vars)");
    const adapter2 = new TypesenseInstantSearchAdapter({
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
      },
      additionalSearchParameters: {
        query_by: SEARCHABLE_FIELDS.join(","),
        per_page: 250,
        max_hits: 10000,
        limit_hits: 10000,
        exhaustive_search: true,
      },
    });
    return adapter2;
  } else {
    console.log("🚀 Using Typesense Adapter 1 (with standard env vars)");
    return typesenseInstantSearchAdapter;
  }
};

const selectedAdapter = getTypesenseAdapter();

// Debug logging to check configuration
console.log("🔧 Typesense Adapter Configuration:", {
  hasAdapter2Config: !!(
    process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_HOST2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_PORT2 &&
    process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2
  ),
  adapter: selectedAdapter,
  searchParameters: selectedAdapter.additionalSearchParameters,
});

export const searchClient = selectedAdapter.searchClient;
