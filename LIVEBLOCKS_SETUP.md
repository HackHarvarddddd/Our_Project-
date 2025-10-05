# Liveblocks Setup Instructions

## 1. Get Liveblocks API Key

1. Go to [Liveblocks Dashboard](https://liveblocks.io/dashboard)
2. Sign up or log in to your account
3. Create a new project
4. Copy your secret key from the project settings

## 2. Configure Environment Variables

Create a `.env` file in the backend directory with:

```
LIVEBLOCKS_SECRET_KEY=sk_test_your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

## 3. Features Implemented

### Real-time Collaborative Canvas
- Two matched users can draw together in real-time
- Cursor tracking shows where other users are drawing
- Canvas state is synchronized across both users
- Clear canvas functionality

### Real-time Chat
- Instant messaging between matched users
- Message history is maintained during the session

### Room Management
- Automatic room creation for matched pairs
- Unique room IDs for each pair
- Room access control (only matched users can join)

## 4. Usage

1. Complete the quiz to get matched with other users
2. Go to a match detail page
3. Click "Start Collaborative Room" button
4. Both users will be taken to the collaborative room
5. Draw together and chat in real-time!

## 5. API Endpoints

- `POST /api/rooms/create` - Create a room for two matched users
- `GET /api/rooms` - Get all rooms for current user
- `GET /api/rooms/:roomId` - Get specific room details
- `POST /api/liveblocks/auth` - Authenticate for Liveblocks access

## 6. Database Schema

The system adds a new `rooms` table:
```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  user_a TEXT,
  user_b TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_a) REFERENCES users(id),
  FOREIGN KEY(user_b) REFERENCES users(id)
);
```
