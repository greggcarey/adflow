# AdFlow

AI-powered ad production management platform built with Next.js, Prisma, and Claude AI.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **AI**: Anthropic Claude API
- **File Storage**: Vercel Blob
- **UI**: shadcn/ui + Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Anthropic API key
- Google OAuth credentials (for authentication)

### Environment Variables

Create a `.env` file with:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_SECRET="your-auth-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# AI
ANTHROPIC_API_KEY="your-anthropic-api-key"

# File Storage (optional, for Ad Templates feature)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Commands

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed sample data
npm run db:reset     # Reset database
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add a Vercel Postgres database (Storage > Create Database > Postgres)
3. Add environment variables in Project Settings:
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `ANTHROPIC_API_KEY`
   - `BLOB_READ_WRITE_TOKEN` (if using Ad Templates)
4. Deploy

### Troubleshooting Vercel Builds

#### "Failed to collect page data" Error

If the build fails with errors like:
```
Error: Failed to collect page data for /api/ai/generate-concepts
```

**Cause**: Prisma client not generated before Next.js build.

**Solution**: Ensure `package.json` includes:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

#### TypeScript Errors with Prisma Types

When using Prisma with JSON fields stored as strings (for SQLite/Postgres compatibility):

1. API routes should parse JSON strings before returning:
   ```typescript
   const parsed = {
     ...dbRecord,
     features: JSON.parse(dbRecord.features),
   };
   ```

2. Client components should use custom types for API responses, not Prisma types:
   ```typescript
   // Don't use: import type { Product } from "@prisma/client"
   // Instead define response types with parsed fields
   type ProductResponse = {
     features: string[];  // parsed array, not string
   };
   ```

#### Zod Schema Errors

If using Zod v4+, `z.record()` requires a key type:
```typescript
// Old (Zod v3):
z.record(z.unknown())

// New (Zod v4+):
z.record(z.string(), z.unknown())
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Main app pages (protected)
│   ├── (onboarding)/    # Onboarding flow
│   ├── api/             # API routes
│   └── login/           # Auth pages
├── components/
│   ├── layout/          # Sidebar, Header
│   ├── templates/       # Ad Templates components
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── ai.ts            # Claude AI functions
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Utilities
└── types/               # TypeScript types
```

## Features

- **Ideation**: Generate AI-powered ad concepts from products and ICPs
- **Scripting**: Auto-generate video ad scripts from approved concepts
- **Production**: Task management for video production
- **Library**: Store and analyze reference ads with AI
- **Settings**: Company profile and brand voice configuration
