# Advanced Typesense Integration Guide

## 🎯 **Single Source of Truth Approaches**

### **1. Schema-First Development (Recommended)**

Create a shared schema definition that both backend and frontend can use:

#### **Option A: JSON Schema File**

```json
// schemas/profile.json
{
  "collection_name": "profiles",
  "fields": [
    { "name": "id", "type": "string", "required": true },
    { "name": "name", "type": "string", "required": true },
    { "name": "username", "type": "string", "required": true },
    { "name": "title", "type": "string", "required": false },
    { "name": "about", "type": "string", "required": false },
    { "name": "skills", "type": "string[]", "facet": true },
    { "name": "embedding", "type": "float[]", "num_dim": 768 }
  ],
  "searchable_fields": ["name", "username", "title", "about", "skills"],
  "facetable_fields": ["skills", "job_titles", "companies", "schools"],
  "sortable_fields": ["profile_created_at", "followers_count", "indexed_at"]
}
```

#### **Option B: TypeScript Schema Definition**

```typescript
// lib/schema.ts
export const PROFILE_SCHEMA = {
  collection: {
    name: "profiles",
    enable_nested_fields: true,
    default_sorting_field: "indexed_at",
  },
  fields: {
    id: { type: "string", required: true },
    name: { type: "string", required: true },
    username: { type: "string", required: true },
    title: { type: "string", required: false },
    about: { type: "string", required: false },
    skills: { type: "string[]", facet: true },
    embedding: { type: "float[]", num_dim: 768 },
  },
} as const;

// Generate Python schema from TypeScript
export function generatePythonSchema() {
  return {
    name: PROFILE_SCHEMA.collection.name,
    enable_nested_fields: PROFILE_SCHEMA.collection.enable_nested_fields,
    fields: Object.entries(PROFILE_SCHEMA.fields).map(([name, config]) => ({
      name,
      ...config,
    })),
    default_sorting_field: PROFILE_SCHEMA.collection.default_sorting_field,
  };
}
```

### **2. Code Generation Approach**

#### **Generate TypeScript from Python Schema**

Create a script to generate TypeScript types from your Python schema:

```python
# scripts/generate_types.py
import json
from typing import Dict, Any

def python_to_typescript_type(py_type: str) -> str:
    type_mapping = {
        'string': 'string',
        'string[]': 'string[]',
        'int32': 'number',
        'int64': 'number',
        'float[]': 'number[]',
        'bool': 'boolean'
    }
    return type_mapping.get(py_type, 'unknown')

def generate_typescript_interface(schema: Dict[str, Any]) -> str:
    interface_name = schema['name'].title() + 'Hit'

    lines = [f"export interface {interface_name} {{"]

    for field in schema['fields']:
        name = field['name']
        ts_type = python_to_typescript_type(field['type'])
        optional = '?' if not field.get('required', False) else ''
        lines.append(f"  {name}{optional}: {ts_type};")

    lines.append("}")

    return '\n'.join(lines)

# Usage
schema = {
    'name': 'profiles',
    'fields': [
        {'name': 'id', 'type': 'string', 'required': True},
        {'name': 'name', 'type': 'string', 'required': True},
        {'name': 'skills', 'type': 'string[]', 'required': False},
        # ... your schema
    ]
}

typescript_interface = generate_typescript_interface(schema)
print(typescript_interface)
```

### **3. Environment Variable Sync**

Keep your configuration in sync with environment variables:

```typescript
// lib/config.ts
export const TYPESENSE_CONFIG = {
  collection: process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME || "profiles",
  queryBy: process.env.NEXT_PUBLIC_TYPESENSE_QUERY_BY?.split(",") || [
    "name",
    "username",
    "title",
    "about",
    "skills",
  ],
  facetFields: process.env.NEXT_PUBLIC_TYPESENSE_FACET_FIELDS?.split(",") || [
    "skills",
    "job_titles",
    "companies",
    "schools",
  ],
  sortFields: process.env.NEXT_PUBLIC_TYPESENSE_SORT_FIELDS?.split(",") || [
    "profile_created_at",
    "followers_count",
    "indexed_at",
  ],
} as const;
```

## 🔍 **Multisearch Implementation**

The `/multisearch` endpoint allows searching across multiple collections or performing multiple searches simultaneously.

### **1. Basic Multisearch Setup**

```typescript
// lib/multisearch.ts
import { searchClient } from "./typesense";

export async function performMultiSearch(
  queries: Array<{
    collection: string;
    q: string;
    query_by: string;
    filter_by?: string;
    facet_by?: string;
    sort_by?: string;
    per_page?: number;
  }>,
) {
  try {
    const searches = queries.map((query) => ({
      collection: query.collection,
      q: query.q,
      query_by: query.query_by,
      filter_by: query.filter_by || "",
      facet_by: query.facet_by || "",
      sort_by: query.sort_by || "",
      per_page: query.per_page || 10,
    }));

    // Using the underlying Typesense client
    const client = searchClient.search;
    const response = await client.multiSearch({
      searches: searches,
    });

    return response.results;
  } catch (error) {
    console.error("Multisearch error:", error);
    throw error;
  }
}
```

### **2. InstantSearch with Multisearch**

Unfortunately, the InstantSearch adapter doesn't directly support multisearch, but you can create a custom solution:

```typescript
// components/MultiSearch.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { performMultiSearch } from '~/lib/multisearch';

interface MultiSearchProps {
  collections: string[];
  query: string;
}

export function MultiSearch({ collections, query }: MultiSearchProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchMultiple = async () => {
      setLoading(true);
      try {
        const queries = collections.map(collection => ({
          collection,
          q: query,
          query_by: 'name,about,title', // Adjust based on your fields
          per_page: 5
        }));

        const searchResults = await performMultiSearch(queries);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMultiple, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, collections]);

  return (
    <div className="space-y-6">
      {loading && <div>Searching...</div>}

      {results.map((result, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Results from {collections[index]} ({result.found} found)
          </h3>

          <div className="space-y-2">
            {result.hits?.map((hit: any, hitIndex: number) => (
              <div key={hitIndex} className="p-2 bg-gray-50 rounded">
                <h4 className="font-medium">{hit.document.name}</h4>
                {hit.document.about && (
                  <p className="text-sm text-gray-600">{hit.document.about}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **3. Advanced Multisearch with Aggregation**

```typescript
// lib/advanced-multisearch.ts
export async function performAggregatedSearch(
  query: string,
  collections: string[] = ["profiles", "companies", "projects"],
) {
  const queries = collections.map((collection) => ({
    collection,
    q: query,
    query_by: getQueryByForCollection(collection),
    facet_by: getFacetByForCollection(collection),
    per_page: 10,
  }));

  const results = await performMultiSearch(queries);

  // Aggregate results by type
  return {
    profiles: results[0]?.hits || [],
    companies: results[1]?.hits || [],
    projects: results[2]?.hits || [],
    totalFound: results.reduce((sum, result) => sum + (result.found || 0), 0),
    facets: aggregateFacets(results),
  };
}

function getQueryByForCollection(collection: string): string {
  const queryByMap: Record<string, string> = {
    profiles: "name,username,title,about,skills",
    companies: "name,description,industry",
    projects: "name,description,technologies",
  };
  return queryByMap[collection] || "name,description";
}

function getFacetByForCollection(collection: string): string {
  const facetByMap: Record<string, string> = {
    profiles: "skills,companies",
    companies: "industry,size",
    projects: "technologies,status",
  };
  return facetByMap[collection] || "";
}

function aggregateFacets(results: any[]) {
  // Combine facets from all collections
  const aggregated: Record<string, any> = {};

  results.forEach((result) => {
    if (result.facet_counts) {
      Object.entries(result.facet_counts).forEach(([key, value]) => {
        if (!aggregated[key]) {
          aggregated[key] = [];
        }
        aggregated[key].push(...(value as any[]));
      });
    }
  });

  return aggregated;
}
```

### **4. Hybrid Search with Multisearch**

For vector + keyword search across collections:

```typescript
// lib/hybrid-multisearch.ts
export async function performHybridMultiSearch(
  query: string,
  embedding: number[], // From your embedding API
  collections: string[],
) {
  const queries = collections.map((collection) => ({
    collection,
    q: query,
    query_by: "name,about,title",
    vector_query: `embedding:(${embedding.join(",")}, k:10)`,
    per_page: 5,
  }));

  return await performMultiSearch(queries);
}
```

## 🚀 **Best Practices for Your Setup**

### **1. Update Your Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME=profiles
NEXT_PUBLIC_TYPESENSE_QUERY_BY=name,username,title,about,skills,job_titles,companies,schools,projects_text,experience_text,education_text,fulltext,searchable_text
NEXT_PUBLIC_TYPESENSE_FACET_FIELDS=skills,job_titles,companies,schools,project_names
NEXT_PUBLIC_TYPESENSE_SORT_FIELDS=profile_created_at,followers_count,indexed_at
```

### **2. Backend-Frontend Sync Checklist**

- ✅ **Field Names**: Ensure exact match (snake_case in both)
- ✅ **Data Types**: TypeScript types match Typesense types
- ✅ **Required Fields**: Mark required fields correctly in TypeScript
- ✅ **Facets**: Sync facetable fields between backend schema and frontend filters
- ✅ **Sort Fields**: Ensure sort fields exist and are configured correctly
- ✅ **Default Values**: Handle missing/optional fields gracefully

### **3. Development Workflow**

1. **Schema Changes**: Update Python schema first
2. **Generate Types**: Run type generation script
3. **Update Components**: Adjust React components for new fields
4. **Test Locally**: Verify search functionality
5. **Deploy**: Update both backend and frontend together

### **4. Validation Script**

```typescript
// scripts/validate-schema.ts
import {
  PROFILE_COLLECTION_SCHEMA,
  SEARCHABLE_FIELDS,
} from "~/types/typesense";

export function validateSchemaConsistency() {
  const schemaFields = PROFILE_COLLECTION_SCHEMA.fields.map((f) => f.name);
  const searchableFields = SEARCHABLE_FIELDS;

  // Check if searchable fields exist in schema
  const missingFields = searchableFields.filter(
    (field) => !schemaFields.includes(field),
  );

  if (missingFields.length > 0) {
    console.warn("Missing searchable fields in schema:", missingFields);
  }

  return missingFields.length === 0;
}
```

This approach ensures your frontend and backend stay perfectly synchronized while giving you the flexibility to use advanced features like multisearch!
