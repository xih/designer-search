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
  },
});

const typesenseInstantSearchAdapter2 = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2!, // Be sure to use an API key that only allows search operations
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST2!,
        port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT2!),
        path: process.env.NEXT_PUBLIC_TYPESENSE_PATH2 ?? "", // Optional. Example: If you have your typesense mounted in localhost:8108/typesense, path should be equal to '/typesense'
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2!,
      },
    ],
    cacheSearchResultsForSeconds: 2 * 60, // Cache search results from server. Defaults to 2 minutes. Set to 0 to disable caching.
  },
  // The following parameters are directly passed to Typesense's search API endpoint.
  //  So you can pass any parameters supported by the search endpoint below.
  //  query_by is required.
  additionalSearchParameters: {
    // query_by:
    //   process.env.NEXT_PUBLIC_TYPESENSE_QUERY_BY ?? SEARCHABLE_FIELDS.join(","),
    query_by: SEARCHABLE_FIELDS.join(","),
    per_page: 250,
    max_candidates: 10000,
  },
});

export const searchClient = typesenseInstantSearchAdapter2.searchClient;
