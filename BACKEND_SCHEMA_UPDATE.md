# Backend Schema Update Guide

## 🔄 Updated Python Schema

Here's how to update your Python schema to include the new avatar, contact email, and social media fields:

```python
# Updated schema with new fields
schema = {
    'name': collection_name,
    'enable_nested_fields': True,
    'fields': [
        {'name': 'id', 'type': 'string'},
        {'name': 'name', 'type': 'string'},
        {'name': 'username', 'type': 'string'},
        {'name': 'title', 'type': 'string'},
        {'name': 'about', 'type': 'string'},
        {'name': 'location', 'type': 'string'},
        {'name': 'website', 'type': 'string'},

        # New fields for enhanced profile display
        {'name': 'avatar_url', 'type': 'string'},      # Profile photo URL
        {'name': 'contact_email', 'type': 'string'},   # Contact email
        {'name': 'linkedin_url', 'type': 'string'},    # LinkedIn profile URL
        {'name': 'twitter_url', 'type': 'string'},     # Twitter/X profile URL
        {'name': 'github_url', 'type': 'string'},      # GitHub profile URL

        # Existing fields
        {'name': 'skills', 'type': 'string[]', 'facet': True},
        {'name': 'job_titles', 'type': 'string[]', 'facet': True},
        {'name': 'companies', 'type': 'string[]', 'facet': True},
        {'name': 'schools', 'type': 'string[]', 'facet': True},
        {'name': 'project_names', 'type': 'string[]', 'facet': True},
        {'name': 'projects_text', 'type': 'string'},
        {'name': 'experience_text', 'type': 'string'},
        {'name': 'education_text', 'type': 'string'},
        {'name': 'fulltext', 'type': 'string'},
        {'name': 'searchable_text', 'type': 'string'},
        {'name': 'embedding', 'type': 'float[]', 'num_dim': 768},
        {'name': 'profile_created_at', 'type': 'int64', 'sort': True},
        {'name': 'followers_count', 'type': 'int32', 'sort': True},
        {'name': 'indexed_at', 'type': 'int64', 'sort': True}
    ],
    'default_sorting_field': 'indexed_at'
}
```

## 📝 Example Document Structure

Here's an example of how your documents should look with the new fields:

```python
# Example profile document
profile_document = {
    "id": "user_123",
    "name": "John Doe",
    "username": "johndoe",
    "title": "Senior Software Engineer",
    "about": "Passionate full-stack developer with 5 years of experience...",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",

    # New fields
    "avatar_url": "https://images.example.com/profiles/johndoe.jpg",
    "contact_email": "john@example.com",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "twitter_url": "https://twitter.com/johndoe",
    "github_url": "https://github.com/johndoe",

    # Existing fields
    "skills": ["Python", "JavaScript", "React", "Node.js"],
    "job_titles": ["Software Engineer", "Full Stack Developer"],
    "companies": ["TechCorp", "StartupXYZ"],
    "schools": ["Stanford University", "MIT"],
    "project_names": ["E-commerce Platform", "Mobile App"],
    "projects_text": "Built scalable e-commerce platform serving 1M+ users...",
    "experience_text": "5 years experience in full-stack development...",
    "education_text": "Computer Science degree from Stanford...",
    "fulltext": "John Doe Senior Software Engineer Python JavaScript...",
    "searchable_text": "comprehensive searchable text...",
    "embedding": [0.1, 0.2, 0.3, ...],  # 768-dimensional vector
    "profile_created_at": 1640995200,  # Unix timestamp
    "followers_count": 1250,
    "indexed_at": 1703980800  # Unix timestamp
}
```

## 🔄 Migration Strategy

### Option 1: Add Fields to Existing Collection

```python
# Add new fields to existing collection
def add_new_fields_to_collection(client, collection_name):
    new_fields = [
        {'name': 'avatar_url', 'type': 'string'},
        {'name': 'contact_email', 'type': 'string'},
        {'name': 'linkedin_url', 'type': 'string'},
        {'name': 'twitter_url', 'type': 'string'},
        {'name': 'github_url', 'type': 'string'}
    ]

    for field in new_fields:
        try:
            client.collections[collection_name].fields.create(field)
            print(f"Added field: {field['name']}")
        except Exception as e:
            print(f"Error adding field {field['name']}: {e}")
```

### Option 2: Recreate Collection (Recommended)

```python
# Backup existing data, recreate collection with new schema
def migrate_collection_with_new_fields(client, collection_name):
    # 1. Export existing data
    existing_docs = []
    search_results = client.collections[collection_name].documents.search({
        'q': '*',
        'per_page': 250  # Adjust based on your data size
    })

    # Get all documents
    for hit in search_results['hits']:
        existing_docs.append(hit['document'])

    # 2. Drop old collection
    client.collections[collection_name].delete()

    # 3. Create new collection with updated schema
    client.collections.create(schema)

    # 4. Re-index documents with default values for new fields
    updated_docs = []
    for doc in existing_docs:
        # Add default values for new fields
        doc.update({
            'avatar_url': None,
            'contact_email': None,
            'linkedin_url': None,
            'twitter_url': None,
            'github_url': None
        })
        updated_docs.append(doc)

    # 5. Import updated documents
    client.collections[collection_name].documents.import_(updated_docs)
```

## 🎯 Data Extraction Examples

### Extract Avatar URLs

```python
def extract_avatar_url(profile_data):
    """Extract avatar URL from various sources"""
    # LinkedIn profile photo
    if 'linkedin_photo' in profile_data:
        return profile_data['linkedin_photo']

    # GitHub avatar
    if 'github_avatar' in profile_data:
        return profile_data['github_avatar']

    # Gravatar based on email
    if 'email' in profile_data:
        import hashlib
        email_hash = hashlib.md5(profile_data['email'].lower().encode()).hexdigest()
        return f"https://www.gravatar.com/avatar/{email_hash}?s=200&d=identicon"

    return None
```

### Extract Social Media URLs

```python
def extract_social_urls(profile_data):
    """Extract social media URLs from profile data"""
    social_urls = {}

    # LinkedIn
    if 'linkedin_username' in profile_data:
        social_urls['linkedin_url'] = f"https://linkedin.com/in/{profile_data['linkedin_username']}"
    elif 'linkedin_url' in profile_data:
        social_urls['linkedin_url'] = profile_data['linkedin_url']

    # Twitter
    if 'twitter_handle' in profile_data:
        handle = profile_data['twitter_handle'].lstrip('@')
        social_urls['twitter_url'] = f"https://twitter.com/{handle}"
    elif 'twitter_url' in profile_data:
        social_urls['twitter_url'] = profile_data['twitter_url']

    # GitHub
    if 'github_username' in profile_data:
        social_urls['github_url'] = f"https://github.com/{profile_data['github_username']}"
    elif 'github_url' in profile_data:
        social_urls['github_url'] = profile_data['github_url']

    return social_urls
```

## 📧 Contact Email Extraction

```python
def extract_contact_email(profile_data):
    """Extract contact email with privacy considerations"""
    # Primary email
    if 'contact_email' in profile_data:
        return profile_data['contact_email']

    # Work email
    if 'work_email' in profile_data:
        return profile_data['work_email']

    # Only use personal email if explicitly marked as public
    if profile_data.get('email_is_public', False) and 'email' in profile_data:
        return profile_data['email']

    return None
```

## 🚀 Complete Update Script

```python
def update_profile_collection():
    import typesense

    # Initialize client
    client = typesense.Client({
        'nodes': [{
            'host': 'localhost',
            'port': '8108',
            'protocol': 'http'
        }],
        'api_key': 'your-api-key',
        'connection_timeout_seconds': 60
    })

    collection_name = 'profiles'

    try:
        # Migrate collection
        migrate_collection_with_new_fields(client, collection_name)

        # Update documents with new field data
        # (You'll need to implement this based on your data sources)
        update_documents_with_new_fields(client, collection_name)

        print("✅ Profile collection updated successfully!")

    except Exception as e:
        print(f"❌ Error updating collection: {e}")

if __name__ == "__main__":
    update_profile_collection()
```

## ⚡ Frontend Environment Variables

Update your `.env.local` to include the new fields in searchable content:

```bash
# Updated query_by to include new fields if they should be searchable
NEXT_PUBLIC_TYPESENSE_QUERY_BY=name,username,title,about,location,skills,job_titles,companies,schools,projects_text,experience_text,education_text,fulltext,searchable_text,contact_email
```

## 🧪 Testing

After updating your schema, test the new fields:

```python
# Test search with new fields
search_params = {
    'q': 'john',
    'query_by': 'name,username,contact_email',
    'include_fields': 'name,username,avatar_url,contact_email,linkedin_url,twitter_url,github_url'
}

results = client.collections['profiles'].documents.search(search_params)
print(json.dumps(results, indent=2))
```

This update will provide rich profile cards with photos, contact information, and social links in your search interface! 🎉
