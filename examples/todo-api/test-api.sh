#!/bin/bash

echo "Testing Todo API..."
echo ""

# Create a todo
echo "1. Creating a todo..."
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Gati Framework"}' \
  -s | jq .

echo ""
echo "2. Creating another todo..."
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Build an API"}' \
  -s | jq .

echo ""
echo "3. Listing all todos..."
curl http://localhost:3000/api/todos -s | jq .

echo ""
echo "4. Getting a specific todo (use ID from above)..."
read -p "Enter todo ID: " TODO_ID
curl http://localhost:3000/api/todos/$TODO_ID -s | jq .

echo ""
echo "5. Updating the todo..."
curl -X PUT http://localhost:3000/api/todos/$TODO_ID \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' \
  -s | jq .

echo ""
echo "6. Deleting the todo..."
curl -X DELETE http://localhost:3000/api/todos/$TODO_ID -s

echo ""
echo "7. Listing all todos again..."
curl http://localhost:3000/api/todos -s | jq .
