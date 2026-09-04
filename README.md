# Employee Management System (MERN)

Login-protected employee CRUD built with MongoDB, Express, React and Node.

## Run locally

```bash
# 1. Backend
cd Backend
cp .env.example .env      # then fill MONGO_URI and JWT_SECRET
npm install
npm run seed              # admin user + Department / State / City masters
npm run dev               # http://localhost:3000

# 2. Frontend (new terminal)
cd Frontend
cp .env.example .env      # VITE_API_URL
npm install
npm run dev               # http://localhost:5173
```

**Login:** `admin@gmail.com` / `admin123` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding).

## Environment

`Backend/.env`

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` hides internal error messages |
| `PORT` | API port, default 3000 |
| `MONGO_URI` | local or Atlas connection string |
| `JWT_SECRET` | min 32 chars, the server refuses to boot without it |
| `JWT_EXPIRES_IN` | token lifetime, default `1d` |
| `CLIENT_ORIGINS` | comma separated origins allowed by CORS |
| `ALLOW_REGISTRATION` | `false` by default, keeps `/register` closed |

`Frontend/.env` needs `VITE_API_URL` pointing at the API.

## Deploying

```bash
cd Backend  && NODE_ENV=production npm start      # run under pm2 / systemd / a container
cd Frontend && npm run build                      # serve dist/ from nginx or any static host
```

Checklist before going live: a real `JWT_SECRET`, `CLIENT_ORIGINS` set to the deployed frontend,
HTTPS in front of the API (`trust proxy` is already on), and a persistent volume or S3 bucket for
`Backend/uploads`.

## Features

- JWT login; every employee and master endpoint requires a valid token, and the login route is rate limited.
- Employee CRUD with pre-filled edit form and delete confirmation.
- Profile picture upload (Multer, 5MB, jpg/png/webp) with thumbnail preview; replaced and deleted files are removed from disk.
- Gender radio buttons, department typeahead, State dropdown, City dropdown dependent on State.
- Server-side search and pagination.
- Validation on both sides: required fields, valid email, 10-digit phone, 6-digit pincode, unique email.
- Helmet, gzip, CORS allowlist, JSON body limits, health check and graceful shutdown.

## API

Base: `http://localhost:3000`. Everything except `/health` and `/api/auth/*` needs
`Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service and database status |
| POST | `/api/auth/login` | Login, returns a JWT |
| POST | `/api/auth/register` | Disabled unless `ALLOW_REGISTRATION=true` |
| GET | `/api/auth/me` | Current user from the token |
| GET | `/api/masters/departments?search=` | Department master, typeahead |
| GET | `/api/masters/states` | State master |
| GET | `/api/masters/cities?stateId=` | Cities for a state |
| POST | `/api/employees` | Create (multipart) |
| GET | `/api/employees?search=&page=&limit=` | Paginated list / search |
| GET | `/api/employees/:id` | Get one |
| PUT | `/api/employees/:id` | Update (multipart) |
| DELETE | `/api/employees/:id` | Delete |

Images are served at `/uploads/<filename>`.

## Employee fields

`profilePicture` (optional image), `name`, `email` (unique, valid), `phone` (10 digits),
`gender` (M/F/Other), `department` (ref Department), `state` (ref State), `city` (ref City),
`pincode` (6 digits), `address`, `isPermanent` (boolean).

## Structure

```
Backend/
  models/         User, Employee, Department, State, City
  controllers/    authController, employeeController, masterController
  routes/         authRoutes, employeeRoutes, masterRoutes
  middleware/     authMiddleware (JWT), uploadMiddleware (Multer)
  config/         env.js (validated config), db.js
  seed.js         server.js
Frontend/src/
  api/axioApi.js         axios instance, token handling, 401 redirect
  components/
    ProtectedRoute.jsx   redirects to /login without a token
    Navbar.jsx           header with logged-in email + logout
    EmployeeForm.jsx     add / edit form, client-side validation
    DepartmentInput.jsx  department typeahead
    EmployeeTable.jsx    employee list with thumbnails
    ConfirmDialog.jsx    delete confirmation
  pages/          Login, Home (loads data, wires the components)
  App.jsx
```
