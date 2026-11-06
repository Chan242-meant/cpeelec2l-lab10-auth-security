# CPEELEC2L Lab 07 — Interactive Frontend Client

**Course:** CPEELEC2L (Software Development 2)
**Author:** Isla, Christian
**Activity:** Laboratory Activity No. 7 — Interactive Frontend Client

A full-stack Task Management app. The **React (Vite)** frontend consumes the **Express + Prisma + MySQL** REST API for the Task resource.

---

## Features

- View all tasks, loaded from the REST API
- Filter tasks by status (All / To Do / In Progress / Done) with live counts
- Create tasks with a controlled form and field-level validation
- Edit tasks (prefilled form with a Cancel option)
- Change a task's status from the task card
- Delete tasks with a confirmation prompt
- Loading, empty, success, and error states (with a Retry button)
- Labeled inputs, visible focus outlines, and responsive layout (mobile and desktop)

### Validation rules

| Field | Rule |
|---|---|
| Title | Required, 1–100 characters |
| Description | Optional, maximum 500 characters |
| Status | `TODO`, `IN_PROGRESS`, or `DONE` |
| Assign To | Required, must be an existing user |

Validation runs in the browser **and** on the server. The server's response is always the source of truth for saved data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite (JavaScript) |
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | MySQL |

---

## Prerequisites

Install or start these before running the project:

1. **Node.js** (LTS version) and npm
2. **MySQL** running locally (for example through XAMPP, MySQL Workbench, or a MySQL service)
3. A database created for the project, and a valid connection string in the root `.env` file

---

## Setup (first time only)

Run the commands in a terminal (PowerShell).

### 1. Open the project folder

```bash
cd CPEELEC2L_LAB07_Frontend_Client
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure the backend environment

Create a `.env` file in the project root (same level as `package.json`):

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
```

Replace `USER`, `PASSWORD`, and `DATABASE_NAME` with your own MySQL details.

### 4. Set up the database

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed adds the sample users (Alice Santos and Bob Reyes) and some sample tasks.
If `npx prisma db seed` does not work, run `node prisma/seed.cjs` instead.

### 5. Install frontend dependencies

```bash
cd client
npm install
```

### 6. Configure the frontend environment

Create `client/.env` containing:

```env
VITE_API_URL=http://localhost:5000
```

---

## Running the App

You need **two terminals open at the same time**.

### Terminal 1 — Backend (Express API)

From the project root:

```bash
npm run dev
```

(`npm start` also works.)

Expected output:

```
Server is running on http://localhost:5000
```

### Terminal 2 — Frontend (React + Vite)

From the project root:

```bash
cd client
npm run dev
```

Expected output:

```
VITE ready
➜  Local:   http://localhost:5173/
```

---

## Opening the App in the Browser

1. Make sure **both terminals** are running (backend and frontend).
2. Open your browser (Chrome, Firefox, or Edge).
3. Go to **http://localhost:5173**
   - Or hold **Ctrl** and click the `http://localhost:5173/` link in the Vite terminal.
4. The Task Management Client should load with the task list.

### Other useful addresses

| What | Address |
|---|---|
| React frontend | http://localhost:5173 |
| Express API (status message) | http://localhost:5000 |
| All tasks (JSON) | http://localhost:5000/tasks |
| All users (JSON) | http://localhost:5000/users |
| Prisma Studio (database viewer) | Run `npx prisma studio` in the project root, then open the address it prints (for example http://localhost:51212) |

---

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List all tasks (optional `?status=TODO`, `IN_PROGRESS`, or `DONE`) |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/users` | List users (used by the Assign To dropdown) |

### Task fields

`id`, `title`, `description`, `status`, `createdAt`, `updatedAt`, `userId`

### Status codes used

`200` OK, `201` Created, `400` Validation error, `404` Not found, `500` Server error

---

## Project Structure

```
CPEELEC2L_LAB07_Frontend_Client/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # TaskList, TaskItem, TaskForm, TaskFilter, StatusMessage
│   │   ├── hooks/          # useTasks
│   │   ├── services/       # taskService (all API calls)
│   │   └── App.jsx
│   └── .env                # VITE_API_URL
├── prisma/                 # schema.prisma, seed script
├── src/
│   ├── server.js           # Express REST API
│   └── prisma.js           # Prisma client
├── server.js
├── package.json
├── screenshots/            # Test evidence
└── README.md
```

---

## Testing Notes

Manual tests cover normal, boundary, and failure cases:

- **Normal:** create, edit, change status, filter, delete
- **Boundary:** title at 1, 100, and 101 characters; description at 500 and 501 characters
- **Failure:** empty title, no results in a filter, backend stopped, invalid request sent directly to the API
- **Other checks:** responsive layout at 375px and 1280px, keyboard-only navigation, Lighthouse accessibility audit, and UI data compared against `/tasks` and Prisma Studio

Screenshots are stored in the `screenshots/` folder.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to connect` or the page shows an error | The backend is not running. Start it with `npm run dev` in the project root. |
| Page is blank or tasks do not load | Check that `client/.env` has `VITE_API_URL=http://localhost:5000`, then restart the frontend. |
| CORS error in the browser console | Open the app at `http://localhost:5173` (the address the API allows). |
| Database connection error | Make sure MySQL is running and `DATABASE_URL` in the root `.env` is correct. |
| Assign To dropdown is empty | Run `npx prisma db seed` to add the sample users. |
| Port already in use | Close the other program using the port, or stop the old terminal and run again. |

---

## Git Workflow

- Work was done on branch `feature/frontend-client`
- Merged into `master` after completion
- Final submission tagged `lab-07`

---

## Notes

- Do not upload `node_modules/` or any `.env` file when submitting.
- Backend: `npm run dev` (root). Frontend: `npm run dev` (inside `client/`).