# Database Cleanup Guide

This guide explains how to clean the Firebase database collections.

## Available Collections

- `orders` - Customer orders
- `menuItems` - Menu items
- `offers` - Promotional offers
- `metrics` - Analytics metrics
- `users` - User profiles and addresses

## How to Use

### 1. Check Collection Counts

First, check how many documents are in each collection:

```bash
# Using curl (replace with your admin token)
curl -X GET "http://localhost:3000/api/admin/cleanup" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or visit in browser (while logged in as admin):
```
GET /api/admin/cleanup
```

### 2. Delete a Collection

**⚠️ WARNING: This action is irreversible!**

To delete all documents from a collection:

```bash
# Using curl
curl -X DELETE "http://localhost:3000/api/admin/cleanup?collection=orders&confirm=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or use the browser console while logged in as admin:
```javascript
fetch('/api/admin/cleanup?collection=orders&confirm=true', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${YOUR_TOKEN}`
  }
})
.then(r => r.json())
.then(console.log);
```

### 3. Parameters

- `collection` (required): The collection name to delete
  - Options: `orders`, `menuItems`, `offers`, `metrics`, `users`
- `confirm` (required): Must be set to `true` to proceed

### 4. Examples

Delete all orders:
```
DELETE /api/admin/cleanup?collection=orders&confirm=true
```

Delete all menu items:
```
DELETE /api/admin/cleanup?collection=menuItems&confirm=true
```

Delete all offers:
```
DELETE /api/admin/cleanup?collection=offers&confirm=true
```

## Security

- Only admin users can access this endpoint
- Requires explicit confirmation (`confirm=true`)
- All operations are logged

## Notes

- Deletions are processed in batches of 500 (Firestore limit)
- Large collections may take time to delete
- This only deletes documents, not the collection structure itself
- Metrics collection contains sub-documents; only top-level documents are deleted

