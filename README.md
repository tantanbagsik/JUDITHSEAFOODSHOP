# Judith Foods - Multi-Tenant E-Commerce Platform

A modern multi-tenant e-commerce platform built with Next.js 16, MongoDB, and Tailwind CSS.

## Features

- 🏪 **Multi-Store Support** - Each vendor gets their own branded storefront
- 🛒 **Store-Specific Carts** - Separate shopping carts per store
- 📦 **Product Management** - Full CRUD with inventory tracking
- 📊 **Order Management** - Status updates, payment tracking
- 👥 **Customer Management** - Order history, analytics
- 🎨 **Modern UI** - Tailwind CSS with animations
- 📱 **Responsive Design** - Mobile-first approach

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB/Mongoose
- **Auth**: NextAuth.js with JWT
- **Styling**: Tailwind CSS, Lucide Icons
- **Deployment**: Vercel, GitHub

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_GITHUB_REPO_URL)

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Required Environment Variables on Vercel

Add these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT encryption |
| `NEXTAUTH_URL` | Your Vercel deployment URL |

## GitHub Setup

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/judith-seafoods.git

# Push
git branch -M main
git push -u origin main
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── shop/             # Customer storefront
│   │   ├── login/            # Auth pages
│   │   └── register/
│   ├── lib/                  # Utilities & models
│   └── components/           # Reusable components
├── public/                   # Static files
└── vercel.json               # Vercel config
```

## Admin Access

After deployment, visit `/api/seed/admin` to create the admin user:

- Email: admin@judithfoods.com
- Password: admin123

## License

MIT License
