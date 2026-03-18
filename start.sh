#!/bin/bash

echo "========================================"
echo "  Judith Seafoods - Ecommerce Platform"
echo "========================================"
echo ""

echo "[1/4] Checking Node.js..."
node --version

echo ""
echo "[2/4] Checking MongoDB connection..."
echo "Note: Using MongoDB Atlas cloud database"

echo ""
echo "[3/4] Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[4/4] Starting development server..."
echo ""
echo "The app will be available at:"
echo "  - Main site: http://localhost:3000"
echo "  - Dashboard: http://localhost:3000/dashboard"
echo "  - Login: http://localhost:3000/login"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
