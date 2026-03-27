# NoteSphere

NoteSphere is a full-stack note sharing web application where users can sign up, upload study notes, explore public resources, preview files, and download protected content. It includes a dedicated admin panel for managing notes and user accounts.

## Tech Stack

- React
- Vite
- Node.js
- Express
- MongoDB
- JWT authentication
- Multer file uploads

## Features

- User signup and login
- Protected user dashboard
- Note upload with file validation
- Explore page with search and pagination
- Protected preview and download flow
- Download count tracking
- Admin login and admin-only panel
- User and note management tools

## Project Structure

```text
api/
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
  uploads/
shared/
src/
  components/
  context/
  pages/
  services/
```

## Environment Variables

Create a `.env` file in the project root using `.env.example` as a template.

### Required

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Common Local Example

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/notesphere
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_admin_password
ADMIN_NAME=NoteSphere Admin
CLIENT_URL=http://127.0.0.1:5173,http://localhost:5173
VITE_API_URL=http://127.0.0.1:5000/api
UPLOAD_DIR=C:\notesphere\uploads
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and replace the placeholder values with your own settings.

### 3. Start MongoDB

Use a local MongoDB server or a MongoDB Atlas connection string.

### 4. Run the project

```bash
npm run dev
```

This starts:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:5000`

## Available Scripts

```bash
npm run client
npm run server
npm run dev
npm run build
npm run preview
npm start
```

## Main Routes

### Frontend

- `/`
- `/auth`
- `/upload`
- `/dashboard`
- `/explore`
- `/admin-login`
- `/admin`

### Backend API

#### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

#### Notes

- `GET /api/notes`
- `GET /api/notes/stats`
- `GET /api/notes/trending`
- `GET /api/notes/mine`
- `GET /api/notes/:id`
- `GET /api/notes/:id/file`
- `GET /api/notes/:id/download`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

#### Admin

- `POST /api/admin/login`
- `GET /api/admin/notes`
- `PUT /api/admin/notes/:id`
- `DELETE /api/admin/notes/:id`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

## Upload Rules

- Maximum file size: `10 MB`
- Allowed file types: `PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG`
- Title limit: `100` characters
- Subject limit: `60` characters
- Description limit: `500` characters

## Production Notes

- Never commit `.env`
- Keep `JWT_SECRET`, database credentials, and admin password private
- Set `UPLOAD_DIR` to a persistent directory in production
- On Vercel, default upload storage can be ephemeral unless `UPLOAD_DIR` is configured externally
- Use a production `CLIENT_URL` and `VITE_API_URL`

## Safe GitHub Upload Guide

### Safe to commit

- application source code
- `package.json` and `package-lock.json`
- `.gitignore`
- `.env.example`
- docs like `README.md`
- config files that do not contain secrets

### Do not commit

- `.env`
- API keys
- JWT secrets
- database passwords
- admin passwords
- `node_modules/`
- `dist/`
- log files
- real uploaded user files

## Admin Notes

- The reserved admin email cannot be used in public signup
- The backend provisions the admin account from environment variables
- Admin users can edit and delete notes, and delete user accounts

## License

This project is for learning and personal project use unless you choose to add a different license.
