#!/bin/bash

# Draw & Guess AI - Start Script

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Draw & Guess AI...${NC}"

# Kill any existing instances first
echo "Cleaning up existing processes..."
pkill -f 'node server.js' 2>/dev/null
pkill -f 'webpack serve' 2>/dev/null

# Start Backend
echo -e "${GREEN}Starting Backend on port 3001...${NC}"
cd backend
npm start > /dev/null 2>&1 &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
echo -e "${GREEN}Starting Frontend on port 8080...${NC}"
npm run serve > /dev/null 2>&1 &
FRONTEND_PID=$!

echo -e "${BLUE}✨ Servers are running!${NC}"
echo -e "Frontend: http://localhost:8080"
echo -e "Backend:  http://localhost:3001"
echo ""
echo "Press [CTRL+C] to stop both servers."

# Trap SIGINT (Ctrl+C) to kill both processes when exiting the script
trap "kill $BACKEND_PID $FRONTEND_PID; echo -e '\n${BLUE}🛑 Servers stopped.${NC}'; exit" SIGINT

# Keep the script running to monitor Ctrl+C
wait
