# Shared Canvas Feature

This document describes the implementation of the shared canvas feature using Liveblocks for real-time collaboration between matched users.

## Overview

After two users get matched and schedule an outing, they can access a shared canvas where they can collaborate in real-time using drawing tools.

## Features

- **Real-time Collaboration**: Multiple users can draw simultaneously
- **Drawing Tools**: Pen, brush, and eraser tools with customizable colors and sizes
- **Live Presence**: See other users' cursors and activity
- **Canvas Management**: Automatic room creation for matched pairs
- **Responsive Design**: Works on desktop and mobile devices

## Technical Implementation

### Frontend Components

1. **SharedCanvas.jsx**: Main canvas component with Liveblocks integration
2. **liveblocks.js**: Liveblocks client configuration
3. **Canvas.css**: Styling for the canvas interface

### Backend API

1. **Canvas Routes** (`/api/canvas/`):
   - `POST /room`: Create or get canvas room for matched users
   - `GET /room/:roomId`: Get canvas room information
   - `POST /liveblocks-auth`: Liveblocks authentication endpoint

2. **Database Schema**:
   - `canvas_rooms` table to track canvas rooms between users

### Dependencies Added

**Frontend:**
- `@liveblocks/client`: Liveblocks client library
- `@liveblocks/react`: React hooks for Liveblocks

**Backend:**
- `@liveblocks/node`: Node.js SDK for Liveblocks

## Usage Flow

1. Users complete the matching process
2. Users schedule an outing together
3. After scheduling, a "Open Shared Canvas" button appears
4. Clicking the button creates/accesses a canvas room
5. Both users can now collaborate on the shared canvas in real-time

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   # Frontend
   cd frontend && npm install @liveblocks/client @liveblocks/react
   
   # Backend
   cd backend && npm install @liveblocks/node
   ```

2. **Environment Configuration**:
   - Set up Liveblocks account and get API keys
   - Configure authentication endpoint

3. **Database Migration**:
   - The `canvas_rooms` table will be created automatically on server start

## API Endpoints

### POST /api/canvas/room
Creates or returns a canvas room for two matched users.

**Request Body:**
```json
{
  "partnerUserId": "user-id-string"
}
```

**Response:**
```json
{
  "roomId": "canvas_uuid",
  "partnerName": "Partner Name",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/canvas/room/:roomId
Returns canvas room information.

**Response:**
```json
{
  "roomId": "canvas_uuid",
  "partnerName": "Partner Name",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Security

- Canvas rooms are only accessible to the two matched users
- Users must be authenticated to access canvas features
- Canvas rooms are only created for users who have scheduled together

## Future Enhancements

- Save canvas drawings
- Export canvas as images
- Advanced drawing tools (shapes, text, etc.)
- Canvas history and undo/redo
- File sharing within canvas rooms
