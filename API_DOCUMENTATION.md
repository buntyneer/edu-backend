# EDUMANEGE API Documentation

Complete API reference for the EDUMANEGE School Management Backend.

## Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

## Authentication
All endpoints (except `/auth/register` and `/auth/login`) require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

---

## Authentication Endpoints

### Register School
**POST** `/auth/register`

Create a new school account with admin user.

**Request Body:**
\`\`\`json
{
  "schoolName": "My School",
  "instituteType": "school",
  "schoolAddress": "123 Main St",
  "principalName": "John Doe",
  "principalEmail": "principal@school.com",
  "principalPhone": "+1234567890",
  "email": "admin@school.com",
  "password": "SecurePassword123",
  "fullName": "Admin User"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "clx123...",
    "email": "admin@school.com",
    "fullName": "Admin User",
    "role": "ADMIN"
  },
  "school": {
    "id": "clx456...",
    "schoolName": "My School",
    "trialEndsAt": "2025-12-09T..."
  }
}
\`\`\`

### Login
**POST** `/auth/login`

Login user and get JWT token.

**Request Body:**
\`\`\`json
{
  "email": "admin@school.com",
  "password": "SecurePassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
\`\`\`

### Get Current User
**GET** `/auth/me`

Get current authenticated user details.

**Response:**
\`\`\`json
{
  "success": true,
  "user": { ... },
  "school": { ... }
}
\`\`\`

---

## Student Management

### Get Students
**GET** `/students`

List all students with filtering options.

**Query Parameters:**
- `class` - Filter by class
- `section` - Filter by section
- `search` - Search by name or student ID
- `status` - ACTIVE, COMPLETED, DROPPED, TRANSFERRED
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
\`\`\`json
{
  "success": true,
  "students": [ ... ],
  "total": 150
}
\`\`\`

### Create Student
**POST** `/students`

Create a new student (multipart/form-data).

**Form Data:**
- `fullName` - Student full name
- `fatherName` - Father's name
- `motherName` - Mother's name
- `dateOfBirth` - DOB (ISO date)
- `class` - Class (e.g., "10A")
- `section` - Section
- `parentWhatsapp` - WhatsApp number
- `parentEmail` - Parent email
- `enrollmentDate` - Enrollment date
- `studentPhoto` - Photo file (optional)

**Response:**
\`\`\`json
{
  "success": true,
  "student": {
    "id": "clx789...",
    "studentId": "STU000001",
    "fullName": "John Student",
    ...
  }
}
\`\`\`

### Update Student
**PUT** `/students/:id`

Update student details.

**Request Body:** Same as create (optional fields)

### Delete Student
**DELETE** `/students/:id`

Mark student as DROPPED (soft delete).

### Generate QR Code
**GET** `/students/:id/qr-code`

Generate QR code for student (contains studentId, schoolId, fullName).

**Response:**
\`\`\`json
{
  "success": true,
  "qrCodeDataURL": "data:image/png;base64,..."
}
\`\`\`

---

## Attendance

### Mark Attendance
**POST** `/attendance/mark`

Mark student entry or exit.

**Request Body:**
\`\`\`json
{
  "studentId": "clx789...",
  "action": "entry",
  "gatekeeperId": "clx456..." // optional
}
\`\`\`

Actions: `entry`, `exit`

**Response:**
\`\`\`json
{
  "success": true,
  "attendance": {
    "id": "clx111...",
    "status": "PRESENT",
    "isLate": false,
    "entryTime": "2025-12-09T08:15:00Z"
  }
}
\`\`\`

### Get Attendance
**GET** `/attendance`

Retrieve attendance records with filtering.

**Query Parameters:**
- `studentId` - Filter by student
- `date` - Specific date (ISO format)
- `startDate` - Date range start
- `endDate` - Date range end
- `status` - PRESENT, LATE, ABSENT, EARLY_DEPARTURE
- `limit` - Results per page
- `offset` - Pagination

**Response:**
\`\`\`json
{
  "success": true,
  "attendance": [ ... ],
  "total": 245
}
\`\`\`

### Get Attendance Reports
**GET** `/attendance/reports`

Monthly attendance report by student.

**Query Parameters:**
- `month` - Month number (1-12)
- `year` - Year

**Response:**
\`\`\`json
{
  "success": true,
  "report": [
    {
      "studentId": "STU000001",
      "studentName": "John Student",
      "class": "10A",
      "totalDays": 20,
      "present": 18,
      "late": 2,
      "absent": 0,
      "attendancePercentage": "100.00"
    }
  ]
}
\`\`\`

### Get Today's Attendance
**GET** `/attendance/today`

Quick summary of today's attendance.

---

## Batch Management

### Get Batches
**GET** `/batches`

List all batches.

**Query Parameters:**
- `status` - ACTIVE, INACTIVE, COMPLETED

### Create Batch
**POST** `/batches`

Create a new batch.

**Request Body:**
\`\`\`json
{
  "batchName": "Morning Batch",
  "startTime": "08:00",
  "endTime": "12:00",
  "entryTime": "07:45",
  "exitTime": "12:15",
  "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "maxCapacity": 50,
  "batchType": "REGULAR",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
\`\`\`

### Update Batch
**PUT** `/batches/:id`

Update batch details.

### Delete Batch
**DELETE** `/batches/:id`

Delete batch.

---

## Messaging

### Get Conversations
**GET** `/conversations`

List all parent-teacher conversations.

**Query Parameters:**
- `userId` - Filter by user

### Create Conversation
**POST** `/conversations`

Start a new conversation.

**Request Body:**
\`\`\`json
{
  "studentId": "clx789...",
  "conversationType": "PARENT_TEACHER"
}
\`\`\`

### Get Messages
**GET** `/messages`

Get messages from a conversation.

**Query Parameters:**
- `conversationId` - Conversation ID
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset

### Send Message
**POST** `/messages`

Send a message in a conversation.

**Request Body:**
\`\`\`json
{
  "conversationId": "clx111...",
  "messageText": "Student performed well today",
  "messageType": "TEXT",
  "attachmentUrl": "https://..." // optional
}
\`\`\`

### Mark Message as Read
**PUT** `/messages/:id/read`

Mark message as read.

---

## Payments

### Create Order
**POST** `/payments/create-order`

Create Razorpay payment order.

**Request Body:**
\`\`\`json
{
  "schoolId": "clx456...",
  "plan": "12months",
  "amount": 5000
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "orderId": "order_123...",
  "amount": 5000,
  "keyId": "rzp_test_..."
}
\`\`\`

### Verify Payment
**POST** `/payments/verify`

Verify Razorpay payment signature.

**Request Body:**
\`\`\`json
{
  "orderId": "order_123...",
  "paymentId": "pay_123...",
  "signature": "abcd1234...",
  "schoolId": "clx456...",
  "plan": "12months"
}
\`\`\`

---

## Notifications

### Get Notifications
**GET** `/notifications`

Get user notifications.

**Query Parameters:**
- `isRead` - true/false to filter

### Mark as Read
**PUT** `/notifications/:id/read`

Mark notification as read.

---

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Invalid input"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Invalid or expired token"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error"
}
\`\`\`

---

## Rate Limiting

All API endpoints are rate-limited to **100 requests per 15 minutes** per IP address.

When limit exceeded:
\`\`\`json
{
  "error": "Too many requests, please try again later"
}
\`\`\`

---

## Testing with cURL

\`\`\`bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "schoolName": "Test School",
    "instituteType": "school",
    "schoolAddress": "123 Main St",
    "principalName": "John Doe",
    "principalEmail": "principal@test.com",
    "principalPhone": "+1234567890",
    "email": "admin@test.com",
    "password": "SecurePassword123",
    "fullName": "Admin"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "SecurePassword123"
  }'

# Get Students (using token from login)
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer <YOUR_TOKEN>"
\`\`\`

---

For more information, visit: https://edumanege.com/docs
