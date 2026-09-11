# Production Deployment

This project now deploys best as a split stack:

- `Cloudflare Pages` for the frontend
- `Koyeb` for the backend API
- `MongoDB Atlas` for the database
- `Cloudflare R2` for uploads and avatars

## 1. Target Domains

Recommended setup:

- `https://www.yourdomain.com` → frontend
- `https://api.yourdomain.com` → backend

## 2. MongoDB Atlas

Create an Atlas cluster and copy the connection string.

Recommended:

- create a dedicated database user
- allow access from Koyeb
- keep uploaded files out of MongoDB and store only metadata there

## 3. Cloudflare R2

Create one bucket, for example:

```text
notesphere-production
```

Create R2 API credentials with access to that bucket and collect:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=notesphere-production
R2_REGION=auto
```

## 4. Backend on Koyeb

Deploy the repository as a Node web service.

Build command:

```text
npm install && npm run build
```

Start command:

```text
npm start
```

Health check:

```text
/api/health
```

Set these environment variables in Koyeb:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=use_a_strong_password
ADMIN_NAME=NoteSphere Admin
CLIENT_URL=https://www.yourdomain.com,https://yourdomain.com
API_PUBLIC_URL=https://api.yourdomain.com/api
FILE_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=notesphere-production
R2_REGION=auto
MAIL_FROM=NoteSphere <no-reply@yourdomain.com>
RESEND_API_KEY=re_xxxxxxxxx
```

If you prefer SMTP, replace the mail settings with SMTP variables.

## 5. Frontend on Cloudflare Pages

Deploy the same repository or a frontend-only copy to Cloudflare Pages.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Set this environment variable:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

## 6. GoDaddy DNS

Typical DNS setup:

- `www` → CNAME → Cloudflare Pages target
- `api` → CNAME → Koyeb target
- root/apex domain → forward to `https://www.yourdomain.com` or point through your preferred Cloudflare setup

## 7. First Production Checks

After both deploys are live, verify:

- `https://www.yourdomain.com`
- `https://api.yourdomain.com/api/health`
- signup/login works
- admin login works
- avatar upload works
- note upload works
- note preview/download works
- question paper preview/download works

## 8. Migration Note

Existing database records that point to old local-disk files will not automatically reappear unless those old files are copied into R2 with matching metadata. Fresh uploads will go to R2 automatically once `FILE_STORAGE_PROVIDER=r2` is enabled.
