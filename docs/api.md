# API Documentation

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/signin
Sign in with email and password.

### GET /api/auth/session
Get current user session.

## Profile Management

### GET /api/profile
Get current user's profile information.

### PUT /api/profile
Update user profile.

### POST /api/profile/avatar
Upload profile picture.

## Document Management

### POST /api/documents/upload
Upload a resume or document file.

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_id",
    "fileName": "resume.pdf",
    "documentType": "resume",
    "processed": false
  }
}
```

### POST /api/documents/:id/process
Trigger AI processing of uploaded document.

### GET /api/documents
List user's uploaded documents.

### DELETE /api/documents/:id
Delete a document.

## Links Management

### POST /api/links
Add a LinkedIn, GitHub, or portfolio URL.

### GET /api/links
Get user's linked profiles.

### PUT /api/links/:id
Update a linked profile.

### DELETE /api/links/:id
Remove a linked profile.

## Testimonials

### POST /api/testimonials
Add a new testimonial.

### GET /api/testimonials
List user's testimonials.

### POST /api/testimonials/:id/verify
Request verification of a testimonial.

## Chat Interface

### POST /api/chat/session
Start a new chat session for a public profile.

**Request:**
```json
{
  "userId": "profile_user_id"
}
```

**Response:**
```json
{
  "sessionId": "session_id",
  "profileUser": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/chat
Send a message in a chat session.

**Request:**
```json
{
  "sessionId": "session_id",
  "message": "What's your experience with React?"
}
```

**Response:**
```json
{
  "response": "I have 5 years of experience with React, including building scalable applications..."
}
```

## Public Profiles

### GET /[username]
View a user's public profile page.

## Error Responses

All API endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - User not authenticated
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `UPLOAD_TOO_LARGE` - File exceeds size limit
- `PROCESSING_FAILED` - Document processing error
- `RATE_LIMITED` - Too many requests