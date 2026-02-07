# Deployment Guide - Production Deployment

**Target Audience:** DevOps engineers, full-stack developers  
**Prerequisites:** Understanding of Docker, environment variables, production deployment

---

## Overview

This Next.js template can be deployed to:
- **Vercel** (recommended for Next.js)
- **Railway** (simple PaaS)
- **Docker** (containerized deployment)
- **Kubernetes** (orchestrated containers)
- **Self-hosted** (VPS, dedicated server)

---

## Vercel Deployment (Recommended)

### Prerequisites

- GitHub/GitLab/Bitbucket repository
- Vercel account (free tier available)

### Deploy Steps

1. **Push code to Git repository:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

2. **Import project to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Select framework: Next.js
   - Configure environment variables

3. **Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
# Or use Vercel Postgres
# Automatically set when you add Vercel Postgres

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars-long
REFRESH_TOKEN_SECRET=another-secret-key-for-refresh-tokens

# Node Environment
NODE_ENV=production
```

4. **Deploy:**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get production URL: `https://your-project.vercel.app`

### Automatic Deployments

```
main branch → Production deployment
other branches → Preview deployments
```

### Vercel Postgres (Built-in Database)

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add Postgres storage
vercel postgres create

# Get connection string
vercel env pull .env.local
```

---

## Railway Deployment

### Prerequisites

- Railway account
- GitHub repository

### Deploy Steps

1. **Create Railway project:**
   - Visit [railway.app/new](https://railway.app/new)
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically creates database and sets `DATABASE_URL`

3. **Configure environment variables:**
```env
# Auto-set by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Add manually
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=another-secret-key
NODE_ENV=production
```

4. **Configure build settings:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

5. **Deploy:**
   - Railway auto-deploys on push to main branch
   - Get URL from Railway dashboard

---

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for smaller image size
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t my-nextjs-app .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Next.js Configuration for Docker

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone build for Docker
};

export default nextConfig;
```

---

## Kubernetes Deployment

### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
  labels:
    app: nextjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs-app
  template:
    metadata:
      labels:
        app: nextjs-app
    spec:
      containers:
      - name: app
        image: your-registry/nextjs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nextjs-app
spec:
  selector:
    app: nextjs-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: postgresql://user:password@postgres:5432/myapp
  jwt-secret: your-jwt-secret
  refresh-token-secret: your-refresh-token-secret
```

### Ingress (NGINX)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nextjs-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    secretName: nextjs-app-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nextjs-app
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/nextjs-app

# Scale deployment
kubectl scale deployment nextjs-app --replicas=5
```

---

## PostgreSQL Migration

### Switch from SQLite to PostgreSQL

1. **Update dependencies:**
```bash
npm uninstall better-sqlite3
npm install pg drizzle-orm
npm install -D @types/pg
```

2. **Update schema:**
```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').$type<'user' | 'admin'>().notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: boolean('published').notNull().default(false),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

3. **Update connection:**
```typescript
// src/db/connection.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
```

4. **Update Drizzle config:**
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

5. **Generate and run migrations:**
```bash
npm run db:generate
npm run db:migrate
```

---

## Environment Variables

### Development (.env.local)

```env
# Database
DATABASE_URL=file:./data/local.db

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
REFRESH_TOKEN_SECRET=dev-refresh-secret-change-in-production

# Node Environment
NODE_ENV=development
```

### Production (.env.production)

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=production-secret-key-min-32-chars-long
REFRESH_TOKEN_SECRET=production-refresh-secret-min-32-chars

# Node Environment
NODE_ENV=production

# Optional: External services
SENTRY_DSN=https://...
REDIS_URL=redis://...
```

### Required Variables Validation

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

---

## Production Checklist

### Security

- [ ] Use HTTPS/TLS certificates
- [ ] Set secure `JWT_SECRET` (32+ random characters)
- [ ] Enable `httpOnly`, `secure`, `sameSite` cookies
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Use prepared statements (Drizzle ORM handles this)
- [ ] Enable CORS only for trusted origins
- [ ] Set security headers

### Performance

- [ ] Enable Next.js caching (`revalidate`, ISR)
- [ ] Optimize images with `next/image`
- [ ] Use PostgreSQL indexes on frequently queried columns
- [ ] Enable gzip/brotli compression
- [ ] Configure CDN for static assets
- [ ] Database connection pooling

### Monitoring

- [ ] Health check endpoint (`/api/health`)
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Performance monitoring (Vercel Analytics, New Relic)
- [ ] Database query monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

### Database

- [ ] Regular backups (automated)
- [ ] Connection pool configuration
- [ ] Migration strategy
- [ ] Database indexes
- [ ] Query optimization

### Deployment

- [ ] Automated CI/CD pipeline
- [ ] Preview deployments for branches
- [ ] Rollback strategy
- [ ] Zero-downtime deployments
- [ ] Environment-specific configurations

---

## Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/connection';

export async function GET() {
  try {
    // Check database connection
    await db.execute('SELECT 1');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

---

## SSL/TLS Configuration

### Let's Encrypt with NGINX

```nginx
# /etc/nginx/sites-available/nextjs-app
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Certbot Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (crontab)
0 0 * * * certbot renew --quiet
```

---

## Scaling Strategies

### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

### Load Balancer Configuration

```nginx
# nginx.conf
http {
    upstream nextjs_backend {
        least_conn;
        server app_1:3000;
        server app_2:3000;
        server app_3:3000;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://nextjs_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## Troubleshooting

### Common Issues

**1. Database connection fails:**
```
Error: connect ECONNREFUSED
```
**Solution:** Check `DATABASE_URL`, ensure database is running, verify network access.

**2. JWT errors:**
```
Error: secretOrPrivateKey must have a value
```
**Solution:** Set `JWT_SECRET` environment variable.

**3. Module not found:**
```
Error: Cannot find module '@/lib/auth'
```
**Solution:** Check `tsconfig.json` paths configuration, rebuild project.

**4. Build fails on Vercel:**
```
Error: Command "npm run build" exited with 1
```
**Solution:** Check build logs, ensure all dependencies in `package.json`, verify environment variables.

---

**Last Updated:** February 7, 2026  
**Version:** 1.0.0
