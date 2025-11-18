# How to Clean Database - Step by Step Guide

## Method 1: Using Admin UI (Easiest - Recommended) ⭐

1. **Log in as an admin user** on your website

2. **Navigate to Admin Settings**:
   - Go to `/admin/settings` in your browser
   - Or click on "Settings" in the admin navigation

3. **Scroll down to "Database Cleanup" section**

4. **Click "Refresh Collection Counts"** to see how many documents are in each collection

5. **To delete a collection**:
   - Click the red "Delete All" button next to the collection you want to delete
   - **Click it again** to confirm (this prevents accidental deletions)
   - Wait for the deletion to complete

6. **The UI will show**:
   - Collection counts for all collections
   - Success/error messages
   - Progress indicators during deletion

**This is the safest and easiest method!**

---

## Method 2: Using Browser Console

1. **Open your website** and **log in as an admin user**

2. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)

3. **Go to the Console tab**

4. **Get your authentication token**:
   ```javascript
   // This will get your token from localStorage or cookies
   // Check what's available in your app's auth system
   ```

5. **Make the DELETE request**:
   ```javascript
   // Replace YOUR_TOKEN with your actual admin token
   fetch('/api/admin/cleanup?collection=orders&confirm=true', {
     method: 'DELETE',
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN',
       'Content-Type': 'application/json'
     }
   })
   .then(response => response.json())
   .then(data => {
     console.log('Result:', data);
     alert(`Deleted ${data.deleted} documents from ${data.collection}`);
   })
   .catch(error => {
     console.error('Error:', error);
     alert('Error: ' + error.message);
   });
   ```

## Method 2: Using Browser Console with Auto Token (Recommended)

If your app stores the token in a way that's accessible, use this:

```javascript
// First, check what collections exist and their counts
fetch('/api/admin/cleanup', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Collections:', data);
});

// Then delete a specific collection (example: orders)
fetch('/api/admin/cleanup?collection=orders&confirm=true', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // This includes cookies if auth uses cookies
})
.then(response => response.json())
.then(data => {
  console.log('Result:', data);
  alert(`Success! Deleted ${data.deleted} documents`);
})
.catch(error => {
  console.error('Error:', error);
  alert('Error: ' + error.message);
});
```

## Method 3: Using curl Command

1. **Get your admin token** (from browser dev tools or your auth system)

2. **Run the command**:
   ```bash
   curl -X DELETE "http://localhost:3000/api/admin/cleanup?collection=orders&confirm=true" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Replace:
   - `localhost:3000` with your actual server URL
   - `YOUR_ADMIN_TOKEN` with your actual admin authentication token
   - `orders` with the collection you want to delete

## Method 4: Using Postman or Similar Tool

1. **Open Postman** (or similar API testing tool)

2. **Set method to DELETE**

3. **Enter URL**:
   ```
   http://localhost:3000/api/admin/cleanup?collection=orders&confirm=true
   ```

4. **Add Headers**:
   - `Authorization`: `Bearer YOUR_ADMIN_TOKEN`
   - `Content-Type`: `application/json`

5. **Click Send**

## Available Collections to Clean

- `orders` - All customer orders
- `menuItems` - All menu items
- `offers` - All promotional offers
- `metrics` - Analytics metrics
- `users` - User profiles and addresses

## Examples

### Delete all orders:
```javascript
fetch('/api/admin/cleanup?collection=orders&confirm=true', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log);
```

### Delete all menu items:
```javascript
fetch('/api/admin/cleanup?collection=menuItems&confirm=true', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log);
```

### Delete all offers:
```javascript
fetch('/api/admin/cleanup?collection=offers&confirm=true', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log);
```

## Check Collection Counts First

Before deleting, check how many documents exist:

```javascript
fetch('/api/admin/cleanup', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.table(data.collections);
});
```

## ⚠️ Important Warnings

1. **This action is IRREVERSIBLE** - Once deleted, data cannot be recovered
2. **Only works for admin users** - You must be logged in as an admin
3. **Requires confirmation** - Must include `confirm=true` in the URL
4. **Large collections take time** - Be patient for large datasets

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in as an admin user
- Check that your authentication token is valid
- Verify the Authorization header is correctly formatted

### "Collection parameter required" Error
- Make sure you included `?collection=<name>` in the URL
- Check that the collection name is one of the allowed values

### "Confirmation required" Error
- Make sure you included `&confirm=true` in the URL

### No Response
- Check browser console for errors
- Verify the server is running
- Check network tab in browser dev tools

