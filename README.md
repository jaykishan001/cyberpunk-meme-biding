# Cyberpunk Meme Bidding Platform

A full-stack, real-time web application for uploading, voting, and auctioning memes, built with a modern React frontend, Node.js/Express backend, Supabase database, and Socket.IO for live updates.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Frontend Routes](#frontend-routes)
- [Backend API Endpoints](#backend-api-endpoints)
- [WebSocket Events](#websocket-events)
- [License](#license)

---

## Features

- **User Authentication**: Register, login, logout, JWT-based session management.
- **Meme Feed**: Browse, upload, and view memes with real-time updates.
- **Voting**: Upvote/downvote memes, with instant leaderboard and feed updates.
- **Leaderboard**: See top memes ranked by upvotes, updated in real time.
- **Auctions**: Create, join, and bid on meme auctions.
- **My Auctions & Bids**: Track your auctions and bids.
- **Competitions**: Real-time meme competitions with live voting.
- **Profile Management**: View and update your profile, change password.
- **Socket.IO Integration**: Real-time updates for votes, memes, auctions, and competitions.
- **Responsive UI**: Modern, cyberpunk-inspired design with Tailwind CSS.

---

## Tech Stack

### Frontend

- **React 19**
- **React Router 7**
- **Socket.IO Client**
- **Axios**
- **Tailwind CSS**
- **Vite** (build tool)
- **Heroicons** (icons)

### Backend

- **Node.js & Express**
- **Socket.IO**
- **Supabase** (PostgreSQL DB & Auth)
- **Cloudinary** (image uploads)
- **Multer** (file uploads)
- **JWT** (authentication)
- **CORS, dotenv, bcryptjs, uuid**

---

## Project Structure

```
memebiding/
  backend/
    index.js
    package.json
    src/
      app.js
      controller/
      db/
      middleware/
      routes/
      utils/
    socketService/
  frontend/
    package.json
    src/
      App.jsx
      components/
      assets/
      ...
    public/
    index.html
  README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js (v18+ recommended)
- Supabase project (for DB & Auth)
- Cloudinary account (for image uploads)

### 1. Clone the repository

```bash
git clone <repo-url>
cd memebiding
```

### 2. Backend Setup

```bash
cd backend
npm install
# Create a .env file with your environment variables (see below)
npm start
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```
PORT=4000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

---

## Frontend Routes

| Path              | Component         | Description                        |
|-------------------|------------------|------------------------------------|
| `/`               | MemeFeed         | Main meme feed, voting, upload     |
| `/leaderboard`    | Leaderboard      | Top memes, real-time updates       |
| `/auctions`       | AuctionList      | Browse active auctions             |
| `/auctions/create`| CreateAuction    | Create a new auction               |
| `/auction/:id`    | AuctionDetail    | View/bid on a specific auction     |
| `/my-auctions`    | MyAuctions       | Your auctions                      |
| `/my-bids`        | MyBids           | Your bids                          |
| `/competition`    | Competition      | Meme competition (live voting)     |
| `/my-memes`       | MyMemes          | Your uploaded memes                |
| `/login`          | Login            | User login                         |
| `/signup`         | Signup           | User registration                  |

---

## Backend API Endpoints

### Meme Routes (`/api/v1/meme`)

| Method | Path                | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| POST   | `/upload`           | Yes  | Upload a new meme (image)      |
| GET    | `/all`              | No   | Get all memes                  |
| POST   | `/:memeId/vote`     | Yes  | Upvote/downvote a meme         |
| GET    | `/user-memes`       | Yes  | Get memes uploaded by user     |
| GET    | `/leaderboard`      | No   | Get top memes by upvotes       |

### User Routes (`/api/v1/user`)

| Method | Path                | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| POST   | `/register`         | No   | Register a new user            |
| POST   | `/login`            | No   | Login                          |
| POST   | `/logout`           | Yes  | Logout                         |
| GET    | `/profile`          | Yes  | Get user profile               |
| PUT    | `/profile`          | Yes  | Update user profile            |
| PUT    | `/change-password`  | Yes  | Change password                |
| GET    | `/verify`           | Yes  | Verify JWT and get user        |

### Auction Routes (`/api/v1/auction`)

| Method | Path                        | Auth | Description                    |
|--------|-----------------------------|------|--------------------------------|
| GET    | `/active`                   | No   | Get all active auctions        |
| GET    | `/:auctionId`               | No   | Get auction by ID              |
| GET    | `/:auctionId/bids`          | No   | Get bid history for auction    |
| POST   | `/create`                   | Yes  | Create a new auction           |
| POST   | `/:auctionId/bid`           | Yes  | Place a bid on an auction      |
| PATCH  | `/:auctionId/end`           | Yes  | End an auction                 |
| GET    | `/user/auctions`            | Yes  | Get user's auctions            |
| GET    | `/user/bids`                | Yes  | Get user's bids                |
| POST   | `/process-expired`          | Yes  | Process expired auctions (admin)|

### Health Check (`/api/v1/health-check`)

| Method | Path   | Description         |
|--------|--------|---------------------|
| GET    | `/`    | Health check route  |

---

## WebSocket Events

- `vote_update`: Real-time meme vote updates (upvotes/downvotes)
- `new_meme`: Real-time new meme notification
- `auction_updated`, `new_auction`, `auction_ended`, `bid_placed`: Real-time auction events
- `competition_start`, `competition_ready`, `competition_vote_update`, `competition_result`: Real-time competition events
- `wallet_update`: Real-time wallet balance updates

---

