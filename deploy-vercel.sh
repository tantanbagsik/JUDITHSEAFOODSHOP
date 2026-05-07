#!/bin/bash

# Vercel Deployment Script for Judith Foods E-Commerce

echo "🚀 Deploying to Vercel..."

# Environment variables
export NEXTAUTH_SECRET="CyDCx5PGPoZBT9ywwGuARgIfCLpweuHFgmKWWZWHfm8="
export NEXTAUTH_URL="https://judith-seafoods.vercel.app"
export MONGODB_URI="mongodb://raybagsik0825_db_user:Titankalimot08@ac-y5vecbe-shard-00-00.obfa84e.mongodb.net:27017/?appName=Cluster0&ssl=true"

# Deploy to Vercel with environment variables
vercel deploy --prod \
  --env NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --env NEXTAUTH_URL="$NEXTAUTH_URL" \
  --env MONGODB_URI="$MONGODB_URI" \
  --env GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --env GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --env FACEBOOK_CLIENT_ID="$FACEBOOK_CLIENT_ID" \
  --env FACEBOOK_CLIENT_SECRET="$FACEBOOK_CLIENT_SECRET"

echo "✅ Deployment complete!"
echo ""
echo "Visit: https://judith-seafoods.vercel.app"
echo ""
echo "1. Go to https://judith-seafoods.vercel.app/api/seed/admin to create admin"
echo "2. Login at /login with admin@judithfoods.com / admin123"
