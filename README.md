# Quick Start Guide

Get the Trading Dashboard up and running!

## 🚀 Option 1: Docker

### DEV Environment

```bash
docker compose -f docker-compose-dev.yml up --build
```

**Access the application**:

- Frontend APP: http://localhost:5173
- Backend API: http://localhost:3001

**Login**:

- Username: `demo`
- Password: `demo123`

## 💻 Option 2: Local Development

### Prerequisites

- Node.js 22+ installed
- npm installed

1. **Install dependencies**:

```bash
npm run install:all
```

```bash
npm run start:all
```

or

**Start frontend**:
Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

**Start backend**:

```bash
cd backend
npm install
npm run dev
```

## ✅ Verify Installation

1. Open http://localhost:5173
2. You should see the login page
3. Login with demo credentials
4. You should see:
   - 3 tickers (AAPL, TSLA, BTC-USD, BTC)
   - Real-time price updates every 3s
   - Interactive chart
   - Green/red indicators for price changes

**Docker build fails**:

```bash
# Clean Docker cache
docker system prune -a
docker compose build --no-cache
```

**"Cannot find module" errors**:

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**WebSocket connection fails**:

- Ensure backend is running first
- Check backend logs for errors
- Verify backend is on port 3001

## 🔗 Useful URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health
- WebSocket: ws://localhost:3001/ws
