# Deployment Guide

## Prerequisites

- Node.js 18+
- TimescaleDB (Tiger) PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional)
- Vercel account

## Environment Setup

1. **TimescaleDB Database Setup**

   Your database is already configured at TimescaleDB (Tiger):
   - Console: [https://console.cloud.timescale.com/](https://console.cloud.timescale.com/)
   - Connection string format: `postgres://tsdbadmin:<password>@<host>.tsdb.cloud.timescale.com:32849/tsdb?sslmode=require`
   - pgvector extension should be enabled for AI embeddings

2. **Environment Variables**

   Copy `.env.example` to `.env.local` and configure:
   ```env
   DATABASE_URL="postgres://tsdbadmin:<TIMESCALE_DB_PASSWORD>@frnxz38k9o.b6td36ymnz.tsdb.cloud.timescale.com:32849/tsdb?sslmode=require"
   NEXTAUTH_SECRET="your-32-character-secret"
   NEXTAUTH_URL="https://yourdomain.vercel.app"
   OPENAI_API_KEY="sk-proj-your-openai-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

## Production Deployment with Vercel

### Step 1: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from GitHub (Recommended)**
   - Push your code to GitHub
   - Connect repository at [vercel.com](https://vercel.com)
   - Import your SmartFolio repository
   - Vercel will auto-detect Next.js settings

3. **Or Deploy via CLI**
   ```bash
   vercel --prod
   ```

### Step 2: Configure Environment Variables in Vercel

In your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add these variables:

```env
DATABASE_URL=postgres://tsdbadmin:<TIMESCALE_DB_PASSWORD>@frnxz38k9o.b6td36ymnz.tsdb.cloud.timescale.com:32849/tsdb?sslmode=require
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://your-project-name.vercel.app
OPENAI_API_KEY=sk-proj-your-openai-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Set up TimescaleDB Extensions

Connect to your TimescaleDB instance and ensure pgvector is enabled:

```sql
-- Connect via psql or TimescaleDB console
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Step 4: Run Database Migrations

After deployment, run migrations to set up your database schema:

```bash
# From your local terminal
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

Or run via Vercel CLI after connecting to your deployed project:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Vercel Configuration

### Build Settings
Vercel should auto-detect these settings, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### Domain Setup
1. In Vercel dashboard, go to your project
2. Navigate to Settings → Domains
3. Add your custom domain (optional)
4. Update `NEXTAUTH_URL` environment variable to match your domain

## Database Management

### Migrations
```bash
# Create new migration
npx prisma migrate dev --name description-of-change

# Deploy migration to production
npx prisma migrate deploy
```

### Prisma Studio (Database GUI)
```bash
# Access your database via Prisma Studio
npx prisma studio
```

### TimescaleDB Console
- Access your database directly: [https://console.cloud.timescale.com/](https://console.cloud.timescale.com/)
- Run SQL queries, view metrics, manage connections

## File Storage Configuration

### Development
Files stored in `uploads/` directory (ignored by git).

### Production Options

**Option 1: Vercel Blob Storage (Recommended)**
```env
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

**Option 2: AWS S3**
```env
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

**Option 3: Temporary Local Storage**
For initial deployment, files can be stored in `/tmp` directory (note: files are ephemeral on Vercel)

## Performance Optimization

1. **Database Indexing**
   - Indexes automatically created via Prisma migrations
   - Monitor slow queries in production

2. **Caching**
   - Static assets cached by CDN
   - API responses cached where appropriate
   - Consider Redis for session storage

3. **CDN Setup**
   - Configure CDN for static assets
   - Enable gzip compression
   - Optimize images with next/image

## Monitoring

1. **Error Tracking**
   - Set up Sentry for error monitoring
   - Configure alerts for critical errors

2. **Performance Monitoring**
   - Use Vercel Analytics or similar
   - Monitor API response times
   - Track database performance

3. **Logging**
   - Structured logging in production
   - Log rotation and retention policies

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] File upload validation implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Security headers configured

## Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery enabled
   - Test restore procedures

2. **File Backups**
   - Regular backup of uploaded files
   - Version control for application code

## Scaling Considerations

1. **Horizontal Scaling**
   - Load balancer configuration
   - Database connection pooling
   - Session management across instances

2. **Database Scaling**
   - TimescaleDB provides built-in scaling capabilities
   - Connection pooling available through TimescaleDB
   - Use TimescaleDB's time-series features for analytics

3. **File Storage Scaling**
   - Vercel Blob Storage scales automatically
   - CDN built into Vercel for global delivery
   - Image optimization with `next/image`

## TimescaleDB Specific Features

### Time-Series Analytics
```sql
-- Example: Track profile views over time
CREATE TABLE profile_views (
  time TIMESTAMPTZ NOT NULL,
  user_id TEXT NOT NULL,
  visitor_id TEXT,
  page_path TEXT
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('profile_views', 'time');
```

### Performance Monitoring
- Use TimescaleDB console for query performance
- Monitor connection usage and limits
- Set up alerts for database metrics

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify connection string format
   - Check TimescaleDB instance status
   - Ensure SSL mode is set to `require`

2. **Migration Failures**
   - Check database permissions
   - Verify pgvector extension is installed
   - Review migration logs in Vercel dashboard

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all environment variables are set
   - Review build logs in Vercel dashboard