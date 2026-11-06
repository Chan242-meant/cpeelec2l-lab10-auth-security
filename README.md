# CPEELEC2L Lab 07 — Interactive Frontend Client

An interactive full-stack web application demonstrating a **React (Vite) Single-Page Application (SPA)** that consumes an **Express REST API** backed by **Prisma ORM** and **MySQL**.

---

## 📌 Project Overview

This project satisfies the objectives of **Laboratory Activity No. 7 (CPEELEC2L - Software Development 2)**:
* **Frontend Client**: Built with React 19 + Vite in plain JavaScript (`client/` folder).
* **Backend REST API**: Built with Node.js + Express (`http://localhost:5000`) with CORS support.
* **Database & ORM**: MySQL accessed through Prisma 7 using the MariaDB driver adapter.
* **Core Principles**: Reusable components, accessible labeled controls (`WCAG 2.1 AA`), client-side & server-side validation, and treating the server response as the single source of truth for persisted data.

---

## 🏗️ Architecture & How It Works

The system operates across three tiers in a client-server architecture:

```text
┌─────────────────────────────────┐
│     Browser (Client Tier)       │
│  React + Vite (port 5173)       │
│                                 │
│  • TaskForm (Create / Edit)     │
│  • TaskFilter (Status buttons)  │
│  • TaskList & TaskItem cards    │
│  • StatusMessage (Alert banner) │
└──────────────┬──────────────────┘
               │
               │ HTTP Requests (fetch + JSON)
               │ CORS allowed from localhost:5173
               ▼
┌─────────────────────────────────┐
│     Server Tier (Backend)       │
│   Express REST API (port 5000)  │
│                                 │
│  • GET    /tasks (?status=)     │
│  • GET    /tasks/:id            │
│  • POST   /tasks                │
│  • PUT    /tasks/:id            │
│  • DELETE /tasks/:id            │
│  • GET    /users                │
└──────────────┬──────────────────┘
               │
               │ Prisma ORM Client
               ▼
┌─────────────────────────────────┐
│      Data Tier (Database)       │
│    MySQL Server (port 3306)     │
│                                 │
│  • User table (Alice, Bob)      │
│  • Task table (CRUD records)    │
└─────────────────────────────────┘
```

### Data Flow in Action
1. **Initial Page Load**: React mounts -> `useTasks` hook calls `taskService.getTasks()` and `taskService.getUsers()` via HTTP `GET` -> Express queries MySQL with Prisma -> Returns JSON array -> React renders the task grid and populates the user dropdown.
2. **Creating a Task**: User fills out `TaskForm` -> Client validation checks title (1-100 chars) and description (<= 500 chars) -> Sends `POST /tasks` -> Express performs server validation -> Prisma inserts row in MySQL -> Express returns `201 Created` with the new task object -> React prepends the record to the list.
3. **Editing a Task**: Clicking "✏️ Edit" pre-fills `TaskForm` -> User edits fields and clicks "Save Changes" -> Sends `PUT /tasks/:id` -> Server updates record -> React synchronizes local state with verified server response.
4. **Deleting a Task**: Clicking "🗑️ Delete" shows confirmation prompt -> On confirm, sends `DELETE /tasks/:id` -> Server cascades/deletes -> React removes the card from view.

---

## 📁 Project Structure

```text
CPEELEC2L_LAB07_Frontend_Client/
│
├── client/                              <-- Frontend (React + Vite)
│   ├── .env                             <-- VITE_API_URL=http://localhost:5000
│   ├── .env.example                     <-- Environment template
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                     <-- React DOM entry
│       ├── App.jsx                      <-- Main view coordinating state & layout
│       ├── App.css                      <-- Responsive, accessible styling
│       ├── index.css                    <-- Global base resets
│       ├── components/
│       │   ├── TaskForm.jsx             <-- Create & Edit form with client validation
│       │   ├── TaskFilter.jsx           <-- Status filter buttons with counter badges
│       │   ├── TaskItem.jsx             <-- Individual task card with Edit & Delete
│       │   ├── TaskList.jsx             <-- Responsive task grid & empty state
│       │   └── StatusMessage.jsx        <-- Accessible alerts (loading, error, retry)
│       ├── hooks/
│       │   └── useTasks.js              <-- Custom hook managing state & sync
│       └── services/
│           └── taskService.js           <-- Centralized REST API client (fetch)
│
├── prisma/                              <-- Database Layer
│   ├── schema.prisma                    <-- User & Task models, TaskStatus enum
│   └── seed.cjs                         <-- Seed initial users & sample tasks
│
├── src/                                 <-- Backend Layer (Express)
│   ├── prisma.js                        <-- Reusable Prisma Client instance
│   ├── server.js                        <-- Express routes, validation & CORS
│   └── crud.cjs                         <-- CLI CRUD script from Lab 05
│
├── .env                                 <-- Backend DATABASE_URL
├── server.js                            <-- Root backend entry point
├── package.json                         <-- Backend scripts & dependencies
└── README.md                            <-- Documentation
```

---

## 💻 Prerequisites

Before running the application, make sure the following are installed and running on your computer:

1. **Node.js** (v18.0.0 or higher) — Check with `node --version`
2. **npm** (v9.0.0 or higher) — Check with `npm --version`
3. **MySQL Server 8.0** — Running on `localhost:3306` (e.g., via MySQL Workbench, MySQL Windows Service, or XAMPP)

---

## 🚀 Step-by-Step Guide to Run Locally

You will need **TWO terminal windows** running simultaneously:
* **Terminal 1**: Backend API Server (`http://localhost:5000`)
* **Terminal 2**: Frontend Vite Server (`http://localhost:5173`)

---

### Step 1 — Make Sure MySQL is Running
Verify your MySQL service is active. The database connection is configured in the root `.env` file:
```env
DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/lab05_orm"
```
*(Make sure the database name matches your local MySQL setup).*

---

### Step 2 — Install Dependencies (One-time Setup)

#### 1. Root / Backend dependencies:
Open PowerShell in the project root:
```powershell
cd "c:\4th year (1st sem)\socdev2\socdev2(activites)\CPEELEC2L_LAB07_Frontend_Client"
npm install
```

#### 2. Frontend dependencies:
Install the React dependencies in the `client` folder:
```powershell
cd client
npm install
cd ..
```

---

### Step 3 — Seed the Database (Ensure Users Exist)

The application requires at least one User in the database so tasks can be assigned. Seed Alice Santos and Bob Reyes:

```powershell
npm run seed
```

*Expected output:*
```text
Seed completed successfully.
Users created/verified: 2
Tasks created: 5
```

> **Optional**: To visually inspect or edit the database tables in your browser GUI, run `npx prisma studio`.

---

### Step 4 — Start the Backend Server (Terminal 1)

In your first PowerShell window (in the project root):

```powershell
npm start
```

*Expected output:*
```text
Server is running on http://localhost:5000
```

> Keep this terminal open! If you need auto-reload while editing backend code, run `npm run dev`.

---

### Step 5 — Start the Frontend Client (Terminal 2)

Open a **second PowerShell window**, navigate to the `client/` folder, and start Vite:

```powershell
cd "c:\4th year (1st sem)\socdev2\socdev2(activites)\CPEELEC2L_LAB07_Frontend_Client\client"
npm run dev
```

*Expected output:*
```text
  VITE v8.3.4  ready in 180 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 6 — Open the Application in Your Browser

Open your web browser and navigate to:

👉 **[http://localhost:5173](http://localhost:5173)**

You will see the **Task Management Client** loaded with your live database records!

---

## 🎯 How to Use the Application

### 1. View and Filter Tasks
* Click the filter tabs (**All Tasks**, **To Do**, **In Progress**, **Done**).
* Each tab shows a badge with the count of tasks in that status.
* When a filter has 0 tasks, a friendly empty state card is displayed (**"No tasks yet"**).

### 2. Create a New Task
* Fill out the form in the left column:
  * **Title** (Required, 1 to 100 characters). Real-time counter `(0/100)` updates as you type.
  * **Description** (Optional, max 500 characters).
  * **Status** (`To Do`, `In Progress`, `Done`).
  * **Assign To** (Select from live database users: Alice Santos or Bob Reyes).
* Click **"➕ Create Task"**.
* The task is saved to MySQL and immediately appears at the top of the list with a green success alert.

### 3. Edit an Existing Task
* On any task card, click the **"✏️ Edit"** button.
* The form smoothly scrolls into view and switches to edit mode (`✏️ Edit Task #ID`), pre-filling all previous values.
* The card being edited highlights with a blue border and an *"Editing now"* tag.
* Modify the title or description and click **"💾 Save Changes"** to update via `PUT /tasks/:id`.
* Want to discard your changes? Click the **"Cancel"** button to exit edit mode without saving.

### 4. Quick Status Update
* Use the **Status dropdown** directly on any task card to instantly switch its status between `To Do`, `In Progress`, and `Done`.

### 5. Delete a Task
* Click the **"🗑️ Delete"** button on a task.
* A native browser confirmation dialog asks: *"Are you sure you want to delete '...'? This action cannot be undone."*
* Clicking **OK** sends `DELETE /tasks/:id` to MySQL and removes the card.

### 6. Test Network Resiliency & Retry
* Stop the backend terminal (`Ctrl + C`).
* Attempt to create or refresh tasks in the browser.
* A clear red alert appears: *"Cannot connect to server. Please check that your Express backend is running at http://localhost:5000."*
* Notice the app **does not crash**.
* Restart the backend (`npm start`) and click the **"🔄 Retry"** button in the alert banner to instantly reconnect.

---

## ♿ Accessibility & Usability Features

This application follows **WCAG 2.1 AA** standards:
* **Accessible Form Controls**: Every `<input>`, `<textarea>`, and `<select>` is explicitly tied to its `<label>` using matching `id` and `htmlFor` attributes.
* **Live Regions**: Alert banners use `role="alert"` (for errors) and `role="status"` (for loading/success) with `aria-live="polite"` so screen readers announce state changes.
* **Keyboard Navigation**: Full keyboard navigation supported. Press `Tab` to navigate controls with prominent visible focus outlines (`outline: 2px solid #2563eb`).
* **Non-Blocking Validation**: Field-level validation messages appear directly beneath inputs with `aria-invalid="true"` without annoying browser native tooltips.

---

## 📡 REST API Reference

The backend Express server exposes the following endpoints on `http://localhost:5000`:

| Method | Endpoint | Description | Request Body | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Get all tasks (optional `?status=TODO\|IN_PROGRESS\|DONE`) | None | `200`, `400` |
| `GET` | `/tasks/:id` | Get single task by integer ID | None | `200`, `400`, `404` |
| `POST` | `/tasks` | Create a new task | `{ title, description?, status?, userId }` | `201`, `400` |
| `PUT` | `/tasks/:id` | Update an existing task | `{ title?, description?, status?, userId? }` | `200`, `400`, `404` |
| `DELETE` | `/tasks/:id` | Delete task by ID | None | `200`, `400`, `404` |
| `GET` | `/users` | Get all users for assignment dropdown | None | `200` |

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`EADDRINUSE: address already in use :::5000`** | Another node process is using port 5000. | Kill the process in PowerShell: `Get-Process node \| Stop-Process -Force` or use `PORT=5001 npm start`. |
| **`Failed to fetch / Connection refused`** | Backend server is not running. | Make sure Terminal 1 is open and running `npm start`. |
| **`PrismaClientInitializationError`** | MySQL is stopped or password in `.env` is wrong. | Check MySQL service in Windows Services (`services.msc`) and verify credentials in root `.env`. |
| **CORS error in browser console** | Origin mismatch. | Ensure the frontend runs on `http://localhost:5173` which is whitelisted in `src/server.js`. |
