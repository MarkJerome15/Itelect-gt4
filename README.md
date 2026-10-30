# ITELECT GT4 - Backend API

[![CI](https://github.com/MarkJerome15/Itelect-gt4/actions/workflows/ci.yml/badge.svg)](https://github.com/MarkJerome15/Itelect-gt4/actions/workflows/ci.yml)

Express & MongoDB backend for the Session Resource application, configured for serverless deployment on Vercel.

## 🚀 Live Deployment

- **Backend API URL:** [itelect-backend.vercel.app](https://itelect-backend.vercel.app/)

---

## 🛠️ Tech Stack

- **Runtime:** Node.js / Express
- **Language:** TypeScript
- **Database:** MongoDB Atlas (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Deployment:** Vercel (Serverless Functions)

---

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and receive JWT token

### Sessions (`/api/sessions`)
- `GET /api/sessions` - Retrieve all sessions (requires Bearer token)
- `POST /api/sessions` - Create a new session (requires Bearer token)
- `GET /api/sessions/:id` - Get details of a specific session
- `PUT /api/sessions/:id` - Update an existing session
- `DELETE /api/sessions/:id` - Delete a session

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=4000
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

---

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Server will be running at `http://localhost:4000`.

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## 👥 Default Test Accounts

| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Mark Jerome** | `mark@test.com` | `123456` | `user` |
| **Jane Doe** | `jane@test.com` | `123456` | `user` |
| **John Smith** | `john@test.com` | `123456` | `user` |
