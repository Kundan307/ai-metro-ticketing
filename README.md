# SmartAI Metro - Bangalore Metro Ticketing System

A modern, full-stack web application for the Bangalore Namma Metro system. It provides a seamless interface for passengers to book tickets, plan routes, and view live metro insights. It also includes an admin dashboard for managing the system and a QR code scanner for station entry/exit.

## ✨ Features

- **Route Planner:** Plan journeys between Purple and Green line stations, view estimated travel times, fares, transfers, and real-time crowd levels.
- **Smart Booking System:** Book QR code tickets for up to 12 passengers at a time. The system features **dynamic pricing**, where fares may surge slightly during peak hours or high demand.
- **Voice Assistant:** An integrated voice assistant that helps users understand fares, check train timings, and get route information hands-free.
- **QR Scanner:** A built-in web-based QR scanner for simulated station entry and exit validation. 
- **Admin Dashboard & Live Insights:** View live statistics including total tickets booked, current active passengers in the system, revenue, and predictive demand insights.
- **Wallet & Transactions:** Users have a simulated digital wallet for quick, seamless ticket purchases and refunds.
- **Weather Integration:** A live weather widget on the dashboard to help passengers plan their journeys better based on current Bangalore weather.

## 🛠️ Tech Stack

**Frontend:**
- React (18.x) + Vite
- TypeScript
- Tailwind CSS + shadcn/ui components (Radix UI)
- Wouter (for lightweight routing)
- TanStack Query (React Query) for data fetching
- `html5-qrcode` for QR scanning
- Web Speech API for the Voice Assistant

**Backend:**
- Express.js (Node.js)
- TypeScript
- Drizzle ORM
- PostgreSQL (via `pg`)
- `express-session` for authentication management
- Zod for payload validation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A PostgreSQL database (or you can use the built-in simulated storage if configured)

### Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following lines (replace with your actual DB credentials or secrets):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/metro_db
   SESSION_SECRET=your_super_secret_session_key
   ADMIN_SECRET=admin_secret_key
   ```

3. **Push the database schema:**
   If you're using Postgres, push the Drizzle schema to your database first:
   ```bash
   npm run db:push
   ```
   *Note: On first boot, the system automatically seeds the 52 Purple and Green line stations.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`.

### Building for Production

To create a production build and run the server:
```bash
npm run build
npm start
```

## 🗺️ Application Structure

- `/client/src/pages/` - React components for the main views (Dashboard, Booking, Route Planner, Scanner, etc.)
- `/client/src/components/` - Reusable UI components (Sidebar, Voice Assistant, Headers, layout wrappers, etc.)
- `/server/` - Express backend routes, API controllers, and mock insight generation.
- `/server/storage.ts` - Database interface logic (using Drizzle ORM).
- `/shared/schema.ts` - Shared Zod schemas and Drizzle tables used by both the frontend and backend to ensure type safety.

## 📄 License

This project is licensed under the MIT License.
