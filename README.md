# NoteSphere Full-Stack Setup

This project now has:

- React + Vite frontend
- Node.js + Express backend
- MongoDB database
- JWT authentication
- Protected note management routes
- File uploads for note attachments

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
  uploads/
src/
  components/
  context/
  pages/
  services/
```

## 1. Create Environment File

Create a `.env` file in the project root and copy the values from `.env.example`.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/notesphere
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://127.0.0.1:5173,http://localhost:5173
VITE_API_URL=http://127.0.0.1:5000/api
UPLOAD_DIR=C:\notesphere\uploads
```

## 2. Start MongoDB

Make sure MongoDB is running locally, or replace `MONGODB_URI` with your MongoDB Atlas connection string.

Local example:

1. Install MongoDB if needed
2. Start the MongoDB service
3. Confirm it is listening on `mongodb://127.0.0.1:27017`

## 3. Install Dependencies

From the project root:

```bash
npm install
```

## 4. Run the Full Stack

From the project root:

```bash
npm run dev
```

This starts:

- Express API on `http://127.0.0.1:5000`
- Vite frontend on `http://127.0.0.1:5173`

## 5. Use the App

1. Open `http://127.0.0.1:5173`
2. Go to `Login`
3. Create a new account
4. Open `Upload Notes`
5. Upload a note file
6. Go to `Explore` and download/search notes

## Available Scripts

```bash
npm run client   # start Vite only
npm run server   # start Express API only
npm run dev      # start both client and server
npm run build    # production frontend build
npm run preview  # preview built frontend
```

## Backend API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Notes

- `GET /api/notes`
- `GET /api/notes/trending`
- `GET /api/notes/mine`
- `GET /api/notes/:id`
- `GET /api/notes/:id/download`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

## Authentication Flow

- Signup/login returns a JWT token
- The frontend stores the token in local storage
- Axios sends the token in the `Authorization` header
- Protected backend routes use JWT middleware
- The `/upload` page is protected on the frontend

## Notes

- Uploaded files are stored in `backend/uploads`
- Note metadata is stored in MongoDB
- Downloads increment the note's download counter
- Title limit: 100 characters
- Subject limit: 60 characters
- Description limit: 500 characters
- Upload limit: 1 file per note, up to 5 MB
- Public, dashboard, and admin note lists are paginated for better scaling
- Note and user search now use MongoDB text indexes
- Set `UPLOAD_DIR` in production so uploads live in a persistent folder instead of ephemeral storage

## Admin Access

- The app now supports a dedicated admin login route at `/admin-login`
- The admin panel route is `/admin`
- The backend provisions the admin account automatically from `.env`
- Required admin environment values:

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_NAME=Your Name
```

- Public signup cannot use the reserved admin email
- Admin capabilities include:
  - review and filter all notes
  - edit note metadata and status
  - approve or reject notes
  - delete notes
  - list user accounts
  - delete user accounts and their uploaded notes
