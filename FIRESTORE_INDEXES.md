# Required Firestore Indexes

This document lists the Firestore composite indexes required for the optimized inspection page queries.

## Admin Inspections Page Indexes

### Primary Index (Optimal Performance)
**Collection:** `maintenances`
**Fields:**
- `inspection.createdAt` (Ascending)

**Purpose:** Enables efficient querying of maintenance records with inspections, sorted by inspection creation date for both pagination and export.

**Firestore Console Command:**
```bash
gcloud firestore indexes composite create \
  --collection-group=maintenances \
  --field-config=field-path="inspection.createdAt",order=ascending
```

### Export Date Range Index (Required for Export Functionality)
**Collection:** `maintenances`
**Fields:**
- `inspection.createdAt` (Ascending) - for range queries

**Purpose:** Enables efficient date range querying for export functionality. Supports queries with `>=` and `<=` operators on `inspection.createdAt` field.

**Firestore Console Command:**
```bash
gcloud firestore indexes composite create \
  --collection-group=maintenances \
  --field-config=field-path="inspection.createdAt",order=ascending
```

**Note:** This is the same index as the Primary Index above, supporting both pagination and export date range queries.

### Fallback Index 1 (Status-Based Filtering)
**Collection:** `maintenances`
**Fields:**
- `status` (Ascending)
- `updatedAt` (Descending)

**Purpose:** Fallback query for when the primary index is not available.

**Firestore Console Command:**
```bash
gcloud firestore indexes composite create \
  --collection-group=maintenances \
  --field-config=field-path="status",order=ascending \
  --field-config=field-path="updatedAt",order=descending
```

### Fallback Index 2 (Simple Ordering)
**Collection:** `maintenances`
**Fields:**
- `updatedAt` (Descending)

**Purpose:** Simple ordering for basic queries without complex filters.

**Note:** This index likely already exists as it's commonly used for general maintenance queries.

## Query Strategies

The application implements a progressive fallback system:

### Pagination Queries
1. **Primary Strategy**: `where("inspection.createdAt", "!=", null) + orderBy("inspection.createdAt", "desc")`
   - Requires: Primary Index
   - Performance: Optimal
   - Usage: Regular page loading with pagination
   
2. **Fallback Strategy 1**: `where("status", "in", [...]) + orderBy("status") + orderBy("updatedAt", "desc")`
   - Requires: Fallback Index 1
   - Performance: Good
   
3. **Fallback Strategy 2**: `orderBy("updatedAt", "desc")` + client-side filtering
   - Requires: Fallback Index 2
   - Performance: Acceptable for small datasets

### Export Queries
1. **Date Range Export**: 
   ```javascript
   where("inspection.createdAt", "!=", null)
   + where("inspection.createdAt", ">=", startTimestamp)
   + where("inspection.createdAt", "<=", endTimestamp) 
   + orderBy("inspection.createdAt", "asc")
   ```
   - Requires: Primary Index (ascending)
   - Performance: Optimal for any date range
   - Usage: Export with date filter
   
2. **All Data Export**: 
   ```javascript
   where("inspection.createdAt", "!=", null) 
   + orderBy("inspection.createdAt", "asc")
   ```
   - Requires: Primary Index
   - Performance: Good (gets all inspection data)
   - Usage: Export without date filter
   
3. **Client-Side Sorting**: After database query, results are sorted by `productNumber` ascending for consistent export order.

## Index Creation Steps

### Option A: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Enter the collection and field configurations above

### Option B: Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Deploy indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Option C: firestore.indexes.json (Automated)
Add to your `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "maintenances",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "inspection.createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "maintenances", 
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

## Error Handling

The application handles missing indexes gracefully:

- **`failed-precondition` error**: Shows user-friendly message about index creation in progress
- **`invalid-argument` error**: Logs technical details and shows generic error to user
- **Automatic fallback**: Tries alternative query strategies if primary fails

## Index Status Monitoring

Monitor index creation status in Firebase Console:
- Indexes show as "Building" while being created
- Large collections may take several minutes to complete
- The application will automatically work once indexes are ready

## Performance Impact

### With Proper Indexes:
- Query time: 100-500ms
- Database reads: 10-20 per page
- Memory usage: Minimal (paginated)

### Without Indexes (Fallback):
- Query time: 1-3 seconds  
- Database reads: 50-200+ per page
- Memory usage: Higher (client-side filtering)

## Maintenance

- Indexes update automatically as data changes
- No manual maintenance required
- Monitor query performance in Firebase Console → Performance tab