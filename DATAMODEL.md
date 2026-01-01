# Firestore Data Model Documentation

This document describes the complete Firestore schema for the HR Management Application.

---

## Collection: `users`

**Document ID:** User email address

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `name` | String | Full name of the user |
| `email` | String | Email address (also used as document ID) |
| `photoURL` | String \| null | Profile photo URL from Google Auth |
| `createdAt` | Timestamp | Account creation timestamp |
| `status` | String | User status: `"active"` or `"inactive"` |
| `primaryDepartment` | String | Primary department assignment (e.g., "Sales", "Support") |
| `roles` | Array<String> | Array of role names (e.g., `["Staff", "HR"]`, `["Director"]`) |
| `managedDepartments` | Array<String> | Array of department names this user manages |
| `workSchedule` | Map<Object> | Weekly work schedule object (see structure below) |

### `workSchedule` Structure

Nested object with keys for each day of the week (`"Monday"`, `"Tuesday"`, etc.):

```javascript
{
  "Monday": {
    "active": Boolean,    // Whether the user works on this day
    "checkIn": String,    // Expected check-in time (e.g., "09:00")
    "checkOut": String    // Expected check-out time (e.g., "18:00")
  },
  "Tuesday": { ... },
  // ... etc for all days
}
```

### Sub-collections

#### `users/{email}/leaveQuotas`

**Document ID:** Year as string (e.g., `"2024"`, `"2025"`)

**Fields:**
- Dynamic fields based on leave types configured in the app
- Format: `edit-{leave-type-name}` (e.g., `edit-annual-leave`, `edit-sick-leave`)
  - **Type:** Number - Total quota hours allocated
- Format: `{quota-field-name}-taken` (e.g., `edit-annual-leave-taken`, `edit-sick-leave-taken`)
  - **Type:** Number - Hours already taken

Example:
```javascript
{
  "edit-annual-leave": 80,           // 80 hours allocated
  "edit-annual-leave-taken": 20,     // 20 hours used
  "edit-sick-leave": 48,             // 48 hours allocated
  "edit-sick-leave-taken": 8         // 8 hours used
}
```

#### `users/{email}/documents`

**Document ID:** Auto-generated

**Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `fileName` | String | Original file name |
| `category` | String | Document category/type |
| `storageUrl` | String | Firebase Storage download URL |
| `storagePath` | String | Storage path in Firebase Storage |
| `uploadTimestamp` | Timestamp | When the document was uploaded |
| `uploadedBy` | String | Email of user who uploaded the document |

---

## Collection: `requests`

**Document ID:** Auto-generated

**Description:** Leave and overtime requests

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the requesting user |
| `userName` | String | Name of the requesting user |
| `type` | String | Request type (e.g., "Annual Leave", "Sick Leave", "Overtime") |
| `startDate` | String | Start date in format `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss` |
| `endDate` | String | End date in format `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss` |
| `hours` | Number | Total hours requested |
| `reason` | String | Reason/description for the request |
| `status` | String | Status: `"Pending"`, `"Approved"`, `"Rejected"`, or `"Cancelled"` |
| `createdAt` | Timestamp | Request submission timestamp |
| `department` | String | Department of the requesting user |
| `documentUrl` | String \| null | URL to uploaded supporting document (if any) |
| `approvedBy` | String \| null | Email of user who approved/rejected |
| `processedAt` | Timestamp \| null | Timestamp when request was processed (approved/rejected) |
| `cancelledBy` | String \| null | Email of user who cancelled (if applicable) |

---

## Collection: `claims`

**Document ID:** Auto-generated

**Description:** Expense claims and reimbursements

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the submitting user |
| `userName` | String | Name of the submitting user |
| `department` | String | Department of the submitting user |
| `claimType` | String | Type of claim (e.g., "Transport", "Meals", "Office Supplies") |
| `expenseDate` | String | Date of expense in format `YYYY-MM-DD` |
| `amount` | Number | Claim amount in RM (Malaysian Ringgit) |
| `description` | String | Description of the expense |
| `receiptUrl` | String \| null | URL to uploaded receipt |
| `status` | String | Status: `"Pending"`, `"Approved"`, `"Rejected"`, or `"Paid"` |
| `createdAt` | Timestamp | Claim submission timestamp |
| `approvedBy` | String \| null | Email of manager who approved |
| `rejectedBy` | String \| null | Email of user who rejected (typically Finance) |
| `rejectionReason` | String \| null | Reason for rejection |
| `processedAt` | Timestamp \| null | Timestamp when claim was processed (approved/rejected/paid) |
| `processedBy` | String \| null | Email of Finance user who marked as paid |

---

## Collection: `attendance`

**Document ID:** Auto-generated

**Description:** Daily attendance check-in/check-out records

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the user |
| `userName` | String | Name of the user |
| `department` | String | User's department |
| `date` | String | Date in format `YYYY-MM-DD` |
| `checkInTime` | Timestamp \| null | Check-in timestamp |
| `checkInLocation` | Object \| null | Geolocation object with `lat` and `lng` |
| `checkOutTime` | Timestamp \| null | Check-out timestamp |
| `checkOutLocation` | Object \| null | Geolocation object with `lat` and `lng` |

---

## Collection: `attendanceExceptions`

**Document ID:** Auto-generated

**Description:** Exceptions flagged by the daily attendance check process

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the user |
| `userName` | String | Name of the user |
| `department` | String | User's department |
| `date` | String | Date in format `YYYY-MM-DD` |
| `type` | String | Exception type: `"Absent"`, `"Late"`, `"MissedCheckout"`, or `"EarlyCheckout"` |
| `details` | String | Description/details of the exception |
| `status` | String | Status: `"Pending"`, `"Resolved"`, or `"Corrected"` |
| `acknowledged` | Boolean | Whether the user has acknowledged the exception |
| `resolutionNotes` | String \| null | Notes added when resolving |
| `resolvedBy` | String \| null | Email of manager who resolved |
| `resolvedAt` | Timestamp \| null | Timestamp when resolved |
| `correctionRemarks` | String \| null | Remarks from attendance correction |
| `correctedBy` | String \| null | Email of manager who corrected |
| `correctedAt` | Timestamp \| null | Timestamp when corrected |

---

## Collection: `userAlerts`

**Document ID:** Auto-generated

**Description:** Alerts and notifications for users

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the user to notify |
| `message` | String | Alert message content |
| `type` | String | Alert type (e.g., `"LeaveRejected"`, `"ClaimRejected"`, `"BillRejected"`, `"SupportUpdate"`) |
| `acknowledged` | Boolean | Whether the user has acknowledged the alert |
| `createdAt` | Timestamp | Alert creation timestamp |

---

## Collection: `announcements`

**Document ID:** Auto-generated

**Description:** Company announcements and notifications

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `title` | String | Announcement title |
| `content` | String | Announcement content/message |
| `targetDepartments` | Array<String> | Array of target departments (or `["__ALL__"]` for global) |
| `createdBy` | String | Email of user who created the announcement |
| `createdAt` | Timestamp | Announcement creation timestamp |
| `imageUrl` | String \| null | URL to optional announcement image |
| `attachmentFileUrl` | String \| null | URL to optional attachment file |
| `attachmentFileName` | String \| null | Name of the attachment file |

### Sub-collections

#### `announcements/{announcementId}/acknowledgements`

**Document ID:** User email address

**Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `timestamp` | Timestamp | When the user acknowledged |
| `userName` | String | Name of the acknowledging user |

---

## Collection: `purchaseRequests`

**Document ID:** Auto-generated

**Description:** Purchase requests for office supplies/equipment

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the requesting user |
| `userName` | String | Name of the requesting user |
| `department` | String | Department of the requesting user |
| `itemDescription` | String | Description of the item to purchase |
| `quantity` | Number | Quantity requested |
| `estimatedCost` | Number | Estimated cost in RM |
| `productLink` | String \| null | URL to product page |
| `justification` | String | Business justification for the purchase |
| `status` | String | Status: `"Pending"`, `"Approved"`, `"Rejected"`, `"Processing"`, or `"Completed"` |
| `createdAt` | Timestamp | Request submission timestamp |
| `approvedBy` | String \| null | Email of manager who approved |
| `processedBy` | String \| null | Email of Purchaser who processed |
| `processedAt` | Timestamp \| null | Timestamp when processed |
| `rejectedBy` | String \| null | Email of user who rejected |
| `rejectionReason` | String \| null | Reason for rejection |
| `actualCost` | Number \| null | Actual cost (when completed) |
| `purchaserNotes` | String \| null | Notes from purchaser |
| `receiptUrl` | String \| null | URL to receipt (when completed) |

---

## Collection: `paymentRequests`

**Document ID:** Auto-generated

**Description:** Bill payment requests for vendors/suppliers

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `userId` | String | Email of the submitting user |
| `userName` | String | Name of the submitting user |
| `department` | String | Department of the submitting user |
| `vendorName` | String | Name of the vendor/supplier |
| `amount` | Number | Amount due in RM |
| `billingDate` | String | Billing date in format `YYYY-MM-DD` |
| `notes` | String \| null | Additional notes |
| `invoiceUrl` | String | URL to uploaded invoice |
| `status` | String | Status: `"Pending Approval"`, `"Pending Finance"`, `"Rejected"`, or `"Paid"` |
| `createdAt` | Timestamp | Request submission timestamp |
| `approvedBy` | String \| null | Email of manager who approved |
| `processedBy` | String \| null | Email of Finance user who processed (rejected/paid) |
| `processedAt` | Timestamp \| null | Timestamp when processed |

---

## Collection: `supportRequests`

**Document ID:** Auto-generated

**Description:** IT support tickets and help requests

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `requesterId` | String | Email of the requester |
| `requesterName` | String | Name of the requester |
| `department` | String | Department of the requester |
| `assigneeId` | String | Email of assigned support staff |
| `assigneeName` | String | Name of assigned support staff |
| `subject` | String | Support ticket subject |
| `description` | String | Detailed description of the issue |
| `attachmentLink` | String \| null | Optional link to external resource |
| `fileAttachments` | Array<Object> \| null | Array of file attachment objects (see below) |
| `fileUrl` | String \| null | **Legacy field** - Single file URL (for backward compatibility) |
| `status` | String | Status: `"Open"`, `"In Progress"`, `"Completed"`, or `"Closed"` |
| `createdAt` | Timestamp | Ticket creation timestamp |

### `fileAttachments` Array Structure

Each object in the array:
```javascript
{
  "fileName": String,   // Original file name
  "fileUrl": String     // Firebase Storage download URL
}
```

---

## Collection: `companyCalendar`

**Document ID:** Date string in format `YYYY-MM-DD`

**Description:** Company holidays and non-working days

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `description` | String | Holiday/event description |
| `appliesTo` | Array<String> | Array of departments this applies to, or `["__ALL__"]` for company-wide |
| `createdBy` | String | Email of user who created the entry |
| `createdAt` | Timestamp | Entry creation timestamp |

---

## Collection: `configuration`

**Document ID:** `"main"` (single document)

**Description:** Application-wide configuration

### Fields

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `availableDepartments` | Array<String> | List of all available departments |
| `availableRoles` | Array<String> | List of all available user roles |
| `requestTypes` | Array<Object> | Array of leave/OT request type configurations (see below) |
| `claimTypes` | Array<Object> | Array of expense claim type configurations (see below) |

### `requestTypes` Array Structure

Each object:
```javascript
{
  "name": String,              // e.g., "Annual Leave"
  "hasQuota": Boolean,         // Whether this type uses leave quota
  "isPaidLeave": Boolean       // Whether this is paid leave
}
```

### `claimTypes` Array Structure

Each object:
```javascript
{
  "name": String,              // e.g., "Transport"
  "category": String           // "Allowance" or "Reimbursement"
}
```

---

## Notes

### Timestamps
- All `Timestamp` fields use Firestore's `serverTimestamp()` when created/updated from the client
- When reading, these are Firestore `Timestamp` objects that can be converted to JavaScript `Date` objects using `.toDate()`

### Status Values
- Status fields typically use predefined string values (e.g., `"Pending"`, `"Approved"`, `"Rejected"`)
- Always check the specific collection documentation above for valid status values

### Nullable Fields
- Fields marked as `String \| null` or `Number \| null` may be `null` if not set
- Always handle null cases when reading these fields

### Dynamic Fields
- Some collections use dynamic field names based on configuration (e.g., `leaveQuotas` uses leave type names)
- These are documented in the relevant collection section above

---

**Last Updated:** 2025-01-27
**Document Version:** 1.0

