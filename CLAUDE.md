# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev    # Start development server on http://localhost:3000
npm run build  # Build production bundle
npm start      # Start production server
npm run lint   # Run ESLint
```

## Architecture Overview

### Dual Database Design
This project uses a **dual-database architecture**:
- **MySQL**: User authentication data (`users`, `roles` tables)
- **MongoDB**: Gallery/image data (`img_map` collection)

Connection pooling is used for MySQL, while MongoDB uses Mongoose with cached connections for serverless environments.

### Database Connection Pattern
Both database connectors are designed for Next.js serverless functions:
- `lib/mongodb.ts`: Global connection caching to avoid reconnecting on every API call
- `lib/mysql.ts`: Connection pool with configurable limits (default: 10)

MongoDB supports two configuration methods:
1. Complete URI via `MONGODB_URI` (takes priority)
2. Separate config vars (`MONGODB_HOST`, `MONGODB_PORT`, etc.) - similar to MySQL style

### Image Storage Architecture
Images are stored in Aliyun OSS (Object Storage Service):
- `lib/oss.ts`: Singleton OSS client with signed URL generation
- URLs are generated on-demand with 2-hour expiry
- Images <20MB get style processing (`style/sort_image`)
- Download URLs include `content-disposition` header

### Authentication Flow
1. Register/Login → JWT token generation (`lib/jwt.ts`)
2. Token stored in browser `localStorage`
3. Client-side auth state managed in `components/Navbar.tsx`
4. Passwords hashed with bcryptjs (salt rounds: 10, see `lib/password.ts`)

### API Route Structure
All API routes follow Next.js 14 App Router conventions:
- `app/api/auth/[register|login]/route.ts`: Authentication endpoints
- `app/api/gallery/route.ts`: Image listing with pagination and filtering
- `app/api/image-url/route.ts`: Generate OSS signed URLs

Gallery API query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `visible`: Filter by visibility (true/false)
- `tag`: Filter by tag name (searches `multi_tags.name`)

### Design System
The UI follows a minimalist design language:
- **Colors**: Exclusively uses `neutral-` Tailwind colors (50-900)
- **Typography**: `font-light` for body text, `tracking-tight` for headings
- **Spacing**: Small font sizes (`text-sm`, `text-xs`) for refined appearance
- **Effects**: No shadows or rounded corners; uses borders and `backdrop-blur-sm`
- **Layout**: Gallery uses CSS columns for masonry/Pinterest-style layout

Key files:
- `components/Navbar.tsx`: Minimal navigation with blur effect
- `app/gallery/page.tsx`: Masonry grid preserving image aspect ratios
- `app/layout.tsx`: Global layout with `bg-neutral-50` background

### MongoDB Schema (via Mongoose)
The `PixivImage` model (`models/PixivImage.ts`) includes:
- Required fields: `pixiv_addr` (unique), `tos_file_name`, `illust_id`
- Optional fields: `title`, `author`, `author_id`, `width`, `height`
- Nested array: `multi_tags` with `name`, `translation`, `visible`
- Computed URLs added in API response: `show_url`, `download_url`

### Environment Variables
Required variables (see `.env.example`):
- MongoDB: Either `MONGODB_URI` OR (`MONGODB_HOST` + `MONGODB_DATABASE`)
- MySQL: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- OSS: `OSS_ENDPOINT`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_BUCKET`

### Client State Management
No global state library - uses React hooks:
- Auth state: Local storage + useState in Navbar
- Gallery state: Component-level useState for pagination/filtering
- Form state: Local useState with error tracking

### TypeScript Patterns
- Interfaces defined inline in page files (e.g., `PixivImage`, `GalleryResponse`)
- Mongoose models use separate type definitions
- API responses typed with NextResponse<T>
- No shared types directory - types colocated with usage

## Database Initialization

### MySQL Setup
Execute SQL from `docs/db.md` to create:
- `users` table with `role_id` foreign key
- `roles` table with default values (1=admin, 2=user)

### MongoDB Setup
No manual setup needed - Mongoose will create the `img_map` collection automatically on first write.

## Common Patterns

### Adding New Gallery Filters
1. Add query parameter parsing in `app/api/gallery/route.ts`
2. Add to MongoDB query object (line 21-29)
3. Update frontend state in `app/gallery/page.tsx`

### Password Operations
Always use `lib/password.ts` utilities:
- `hashPassword()` for registration
- `comparePassword()` for login validation

### OSS URL Generation
Use `getOssService().findUrl(tos_file_name)` which returns both:
- `show_url`: For display (with optional style processing)
- `download_url`: For downloads (with attachment header)
