# Production Deployment

This project works best in production as a single Node service with:

- frontend built by Vite
- backend served by Express
- MongoDB Atlas for the database
- a persistent disk/volume for uploaded files

## Recommended Platform

For the current codebase, Railway is the simplest "full working" option because:

- custom domains are supported
- SSL is managed for you
- you can mount a persistent volume for note uploads
- the app can run as one service after `npm run build`

Vercel is fast for the frontend, but this app stores uploads on disk. On Vercel, local storage is temporary by default, so uploaded files are not a good fit there without moving storage to S3, Cloudinary, Supabase Storage, or a similar service.

## 1. Prepare Production Services

### MongoDB Atlas

Create a MongoDB Atlas database and copy the connection string.

### Railway

Create a new project and deploy this repository.

Add a persistent volume and mount it to:

```text
/data/notesphere-uploads
```

## 2. Railway Build and Start Commands

Use:

```text
Build command: npm install && npm run build
Start command: npm start
```

The frontend production build is created in `dist/`, and the backend now serves that build automatically.

## 3. Required Environment Variables

Set these in Railway:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=use_a_strong_password
ADMIN_NAME=NoteSphere Admin
CLIENT_URL=https://yourdomain.com,https://www.yourdomain.com
UPLOAD_DIR=/data/notesphere-uploads
```

`VITE_API_URL` is not required for this setup. In production, the frontend will call `/api` on the same domain.

## 4. Connect GoDaddy Domain

In Railway, generate a public domain for the service first.

Then add your custom domain in Railway, for example:

```text
yourdomain.com
www.yourdomain.com
```

Railway will show the DNS records you need to add in GoDaddy.

Common setup:

- `www` -> CNAME -> Railway target
- root/apex domain -> ALIAS/ANAME or A record values shown by Railway

After DNS propagation, Railway provisions SSL automatically.

## 5. First Production Checks

After deploy, verify:

- `https://yourdomain.com`
- `https://yourdomain.com/api/health`
- signup/login works
- admin login works
- note upload works
- uploaded file preview/download works after a redeploy

That last check confirms the persistent volume is working.

## 6. Best Upgrade Later

If you want better long-term scale:

- keep Railway or move frontend to Vercel
- move uploads from disk to object storage like S3 or Cloudinary

Once uploads move off local disk, Vercel becomes a stronger option for the frontend.
