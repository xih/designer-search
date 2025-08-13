import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { SEARCHABLE_FIELDS } from "~/types/typesense";

// Try to use adapter2 first (with *2 env vars), fallback to adapter1
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
    connectionTimeoutSeconds: 15, // Increase timeout from default 5s to 15s
    timeoutSeconds: 15, // Increase request timeout from default 5s to 15s
  },
  geoLocationField: "lat_lng_field", // Enable geolocation search
  additionalSearchParameters: {
    query_by: SEARCHABLE_FIELDS.join(","),
    per_page: 1000,
    max_hits: 10000,
    limit_hits: 10000,
    exhaustive_search: true,
    // Explicitly include all fields including image fields and lat_lng_field
    include_fields:
      "id,name,username,title,about,location,website,profilePhotoUrl,photourl,opengraphimageurl,contact_email,linkedin_url,twitter_url,github_url,skills,job_titles,companies,schools,project_names,projects_text,experience_text,education_text,fulltext,searchable_text,embedding,lat_lng_field,profile_created_at,followers_count,indexed_at",
  },
});

export const searchClient = adapter2.searchClient;
