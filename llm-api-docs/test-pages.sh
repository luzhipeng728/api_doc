#!/bin/bash

echo "测试关键页面是否可访问..."

pages=(
  "/"
  "/getting-started.html"
  "/openai/"
  "/openai/chat-completion.html"
  "/claude/"
  "/gemini/"
  "/gemini/gemini-2-5-flash-image.html"
)

for page in "${pages[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173${page}")
  if [ "$status" = "200" ]; then
    echo "✓ ${page} - OK"
  else
    echo "✗ ${page} - Failed (HTTP $status)"
  fi
done
