#!/bin/bash

echo "Starting HTH Estate Management System..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

# Check if database exists, if not run sample data
if [ ! -f "estate_management.db" ]; then
    echo "Setting up sample data..."
    npm run sample-data
    echo
fi

echo "Starting the server..."
echo
echo "The application will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo

npm start
