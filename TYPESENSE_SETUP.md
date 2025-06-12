# Typesense InstantSearch Setup Guide

This project has been configured with Typesense InstantSearch for powerful search functionality.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Typesense Server Configuration
NEXT_PUBLIC_TYPESENSE_HOST=localhost
NEXT_PUBLIC_TYPESENSE_PORT=8108
NEXT_PUBLIC_TYPESENSE_PROTOCOL=http
NEXT_PUBLIC_TYPESENSE_API_KEY=your-search-only-api-key
NEXT_PUBLIC_TYPESENSE_PATH=

# Typesense Collection Configuration
NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME=products
NEXT_PUBLIC_TYPESENSE_QUERY_BY=name,description,categories
```

### For Local Development

1. **Install Typesense Server locally:**

   ```bash
   # Using Docker
   docker run -p 8108:8108 -v/tmp/typesense-data:/data typesense/typesense:0.25.2 \
     --data-dir /data --api-key=xyz --enable-cors
   ```

2. **Environment variables for local setup:**
   ```bash
   NEXT_PUBLIC_TYPESENSE_HOST=localhost
   NEXT_PUBLIC_TYPESENSE_PORT=8108
   NEXT_PUBLIC_TYPESENSE_PROTOCOL=http
   NEXT_PUBLIC_TYPESENSE_API_KEY=xyz
   NEXT_PUBLIC_TYPESENSE_PATH=
   NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME=products
   NEXT_PUBLIC_TYPESENSE_QUERY_BY=name,description,categories
   ```

### For Cloud Typesense

1. **Sign up for Typesense Cloud** at [https://cloud.typesense.org](https://cloud.typesense.org)

2. **Environment variables for cloud setup:**
   ```bash
   NEXT_PUBLIC_TYPESENSE_HOST=xxx.a1.typesense.net
   NEXT_PUBLIC_TYPESENSE_PORT=443
   NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
   NEXT_PUBLIC_TYPESENSE_API_KEY=your-search-only-api-key
   NEXT_PUBLIC_TYPESENSE_PATH=
   NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME=your-collection-name
   NEXT_PUBLIC_TYPESENSE_QUERY_BY=name,description,categories
   ```

## File Structure

The implementation includes:

- **`src/lib/typesense.ts`** - Typesense adapter configuration
- **`src/components/TypesenseSearch.tsx`** - Reusable search component
- **`src/app/search/page.tsx`** - Search page implementation

## Usage

### Basic Search Page

The search page is already configured at `/search` with:

- Search input
- Category filters
- Results display
- Pagination
- Search statistics

### Using the Reusable Component

You can use the TypesenseSearch component anywhere in your app:

```tsx
import TypesenseSearch from "~/components/TypesenseSearch";

function MyPage() {
  return (
    <TypesenseSearch
      indexName="products"
      showFilters={true}
      placeholder="Search products..."
      className="max-w-4xl"
    />
  );
}
```

### Component Props

- `indexName?: string` - Override the collection name
- `showFilters?: boolean` - Show/hide the filters sidebar (default: true)
- `placeholder?: string` - Search box placeholder text
- `className?: string` - Additional CSS classes

## Data Structure

The search expects documents with this structure:

```json
{
  "name": "Product Name",
  "description": "Product description",
  "categories": ["category1", "category2"]
}
```

You can modify the `SearchHit` interface in both files to match your data structure.

## Creating a Collection

Before using the search, you need to create a collection in Typesense:

```javascript
// Example collection schema
const schema = {
  name: "products",
  fields: [
    { name: "name", type: "string" },
    { name: "description", type: "string" },
    { name: "categories", type: "string[]", facet: true },
  ],
};
```

## Customization

### Custom Hit Component

Modify the `Hit` component in `TypesenseSearch.tsx` to customize how search results are displayed.

### Additional Filters

Add more filters by including additional `RefinementList` components:

```tsx
<RefinementList
  attribute="brand"
  classNames={{
    root: "space-y-2",
    item: "flex items-center",
    label: "ml-2 text-sm cursor-pointer",
    count: "ml-auto text-xs text-gray-500",
  }}
/>
```

### Styling

The components use Tailwind CSS classes. Modify the `classNames` props to customize the appearance.

## Best Practices

1. **API Key Security**: Use a search-only API key for client-side operations
2. **Environment Variables**: All Typesense config should use `NEXT_PUBLIC_` prefix
3. **Error Handling**: The adapter includes built-in error handling and fallbacks
4. **Caching**: Client-side caching is enabled by default (2 minutes TTL)

## Troubleshooting

1. **CORS Issues**: Ensure CORS is enabled on your Typesense server
2. **API Key**: Make sure you're using the correct API key with search permissions
3. **Collection Name**: Verify the collection exists and matches your environment variable
4. **Network**: Check that the Typesense server is accessible from your client

## Additional Resources

- [Typesense InstantSearch Adapter Documentation](https://github.com/typesense/typesense-instantsearch-adapter)
- [React InstantSearch Documentation](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- [Typesense Documentation](https://typesense.org/docs/)
