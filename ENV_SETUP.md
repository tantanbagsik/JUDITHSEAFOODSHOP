# Judith Seafoods Environment Setup

## Setup Instructions

### 1. Local Development

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your MongoDB Atlas credentials.

### 2. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_URL` | Application URL (use localhost:3000 for dev) | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js (generate with `openssl rand -base64 32`) | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |

### 3. Production Deployment

For production, set environment variables in your hosting provider:
- Vercel: Project Settings → Environment Variables
- Railway/Render: Variables tab
- Docker: Use `-e` flags or docker-compose.yml

### 4. Generate NEXTAUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```
