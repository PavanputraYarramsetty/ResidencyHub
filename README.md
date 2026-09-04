# ResidencyHub

A full-stack web application for hotel and residency management, featuring real-time floor occupancy, 24-hour slab billing calculations, customer management with autosuggest, revenue analytics, and Redis caching.

---

## Architecture Overview

- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js & Express API with a structured Service Layer architecture.
- **Database & Auth**: Supabase (PostgreSQL with RLS and Realtime WebSockets).
- **Caching**: Distributed Redis key-value cache layer with automatic fallback.

For in-depth architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 20/24)
- npm 9+
- Supabase Project (PostgreSQL database & Auth)
- Redis instance (Render Redis, Upstash, or local `redis-server`)

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Client environment (used by Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Redis Connection (optional, system falls back gracefully if absent)
REDIS_URL=rediss://default:password@host:port
```

### 3. Installation

```bash
# Install root, backend, and frontend dependencies
npm install
npm install --prefix client
```

### 4. Running the Application

```bash
# Production mode (build client, run unified server on port 5000):
npm run build --prefix client
npm start

# Development mode (concurrent backend on :5000 and Vite dev server on :5173):
npm run dev
```

---

## Project Structure

```text
ResidencyHub/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # UI components (FloorGrid, RoomCard, Modals)
│   │   ├── constants/          # Presets (roomPresets.js)
│   │   ├── context/            # Global context (Auth, Residency)
│   │   ├── hooks/              # Custom hooks (useBookingForm, useCheckInOut)
│   │   ├── pages/              # Page views (Dashboard, Revenue, Customers)
│   │   ├── services/           # Axios API services (floor, room, booking, etc.)
│   │   └── utils/              # Export & date utilities
├── server/                     # Express Backend
│   ├── src/
│   │   ├── config/             # env.js, redis.js, supabase.js
│   │   ├── controllers/        # Thin HTTP controllers
│   │   ├── middleware/         # auth, roleCheck, error handler
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & cache layer
│   │   └── utils/              # Structured logger, AppError classes
├── supabase/                   # Database schemas and migrations
└── docs/                       # Architecture and design documentation
```

---

## Verification & Testing

```bash
# Test client build
npm run build --prefix client

# Run client linter
npm run lint --prefix client

# Health check endpoint
curl http://localhost:5000/api/health
```
