#!/bin/bash

# GitHub Deployment Script for Judith Foods E-Commerce

echo "🚀 Deploying to GitHub..."

# Set remote origin
git remote add origin https://github.com/tantanbagsik/JUDITHSEAFOODSHOP.git

# Rename branch to main
git branch -M main

# Push to remote
git push -u origin main

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repo"
echo "3. Add environment variables"
echo "4. Deploy!"
