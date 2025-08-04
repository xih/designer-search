# Typesense Environment Configuration Guide

This guide explains how to configure your Typesense environment variables for both local development and production environments.

## Required Environment Variables

Copy these variables to your `.env.local` file and update with your values:

```bash
# Core Typesense Configuration (Required)
NEXT_PUBLIC_TYPESENSE_API_KEY=your-typesense-search-api-key
NEXT_PUBLIC_TYPESENSE_HOST=localhost
NEXT_PUBLIC_TYPESENSE_PORT=8108
NEXT_PUBLIC_TYPESENSE_PROTOCOL=http
NEXT_PUBLIC_TYPESENSE_PATH=""
NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME=profiles

# Optional: Custom query fields (defaults to all searchable fields)
NEXT_PUBLIC_TYPESENSE_QUERY_BY=""
```

## Environment-Specific Overrides (Optional)

### Local Development Overrides

Use these to override the core config when `NODE_ENV=development`:

```bash
NEXT_PUBLIC_TYPESENSE_LOCAL_HOST=localhost
NEXT_PUBLIC_TYPESENSE_LOCAL_PORT=8108
NEXT_PUBLIC_TYPESENSE_LOCAL_PROTOCOL=http
```

### Production Overrides

Use these to override the core config when `NODE_ENV=production`:

```bash
NEXT_PUBLIC_TYPESENSE_PROD_HOST=your-production-typesense-host.com
NEXT_PUBLIC_TYPESENSE_PROD_PORT=443
NEXT_PUBLIC_TYPESENSE_PROD_PROTOCOL=https
```

## Setup Examples

### Example 1: Simple setup (same config for all environments)

```bash
NEXT_PUBLIC_TYPESENSE_API_KEY=xyz123
NEXT_PUBLIC_TYPESENSE_HOST=typesense.example.com
NEXT_PUBLIC_TYPESENSE_PORT=443
NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
```

### Example 2: Different configs for local vs production

```bash
NEXT_PUBLIC_TYPESENSE_API_KEY=xyz123
NEXT_PUBLIC_TYPESENSE_HOST=typesense.example.com  # fallback
NEXT_PUBLIC_TYPESENSE_LOCAL_HOST=localhost        # for development
NEXT_PUBLIC_TYPESENSE_LOCAL_PORT=8108
NEXT_PUBLIC_TYPESENSE_LOCAL_PROTOCOL=http
NEXT_PUBLIC_TYPESENSE_PROD_HOST=prod-typesense.example.com  # for production
NEXT_PUBLIC_TYPESENSE_PROD_PORT=443
NEXT_PUBLIC_TYPESENSE_PROD_PROTOCOL=https
```

## Vector Embedding Search Requirements

For vector embedding search to work properly, ensure your Typesense collection has:

1. **An "embedding" field** of type `float[]` with `num_dim: 768` (or your embedding dimension)
2. **Complete schema** that includes all fields defined in `src/types/typesense.ts`
3. **Proper API key** with search permissions on the collection

### Example Typesense Collection Schema

```json
{
  "name": "profiles",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "name", "type": "string" },
    { "name": "username", "type": "string" },
    { "name": "title", "type": "string" },
    { "name": "about", "type": "string" },
    { "name": "location", "type": "string" },
    { "name": "website", "type": "string" },
    { "name": "profilePhotoUrl", "type": "string" },
    { "name": "contact_email", "type": "string" },
    { "name": "linkedin_url", "type": "string" },
    { "name": "twitter_url", "type": "string" },
    { "name": "github_url", "type": "string" },
    { "name": "skills", "type": "string[]", "facet": true },
    { "name": "job_titles", "type": "string[]", "facet": true },
    { "name": "companies", "type": "string[]", "facet": true },
    { "name": "schools", "type": "string[]", "facet": true },
    { "name": "project_names", "type": "string[]", "facet": true },
    { "name": "projects_text", "type": "string" },
    { "name": "experience_text", "type": "string" },
    { "name": "education_text", "type": "string" },
    { "name": "fulltext", "type": "string" },
    { "name": "searchable_text", "type": "string" },
    { "name": "embedding", "type": "float[]", "num_dim": 768 },
    { "name": "profile_created_at", "type": "int64", "sort": true },
    { "name": "followers_count", "type": "int32", "sort": true },
    { "name": "indexed_at", "type": "int64", "sort": true }
  ],
  "default_sorting_field": "indexed_at"
}
```

## How It Works

The enhanced Typesense configuration automatically:

1. **Detects your environment** (development/production) and uses appropriate settings
2. **Provides fallback configurations** if environment-specific variables aren't set
3. **Supports both text and vector search** with configurable balance parameters
4. **Optimizes caching and performance** based on environment
5. **Includes helpful utility functions** for creating search queries

### Vector Search Usage

```typescript
import {
  createVectorSearchParams,
  createHybridSearchParams,
} from "~/lib/typesense";

// Pure vector search
const vectorParams = createVectorSearchParams(
  [0.1, 0.2, 0.3 /* ... your 768-dim vector */],
  0.0, // alpha: 0 = pure vector search
  50, // k: number of nearest neighbors
);

// Hybrid search (text + vector)
const hybridParams = createHybridSearchParams(
  "software engineer", // text query
  [0.1, 0.2, 0.3 /* ... your vector */], // optional vector
  {
    alpha: 0.3, // 30% vector, 70% text
    k: 50, // nearest neighbors
    facets: ["skills", "companies"],
    filters: "location:San Francisco",
    sortBy: "followers_count:desc",
    page: 1,
    perPage: 20,
  },
);
```

## Security Notes

- **Never expose admin API keys** - only use search-only keys in `NEXT_PUBLIC_*` variables
- **Use HTTPS in production** - always set `NEXT_PUBLIC_TYPESENSE_PROD_PROTOCOL=https`
- **Validate your environment** - the enhanced config includes validation via `env.js`

## Troubleshooting

1. **Connection errors**: Check your host, port, and protocol settings
2. **Vector search not working**: Ensure your collection has the `embedding` field with correct dimensions
3. **Environment variables not loading**: Make sure you're using `NEXT_PUBLIC_` prefix for client-side variables
4. **Schema mismatches**: Verify your collection schema matches the TypeScript interfaces in `src/types/typesense.ts`
