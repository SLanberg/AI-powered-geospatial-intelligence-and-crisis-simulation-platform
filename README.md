# 🌆 City Signal

City Signal is an application designed for reporting and tracking urban infrastructure issues.

---

## ⚡ Quick Start (1-Click Launcher)

The fastest way to start working on the project:

### macOS
Double-click `start.command` or run:
```bash
./start.command
```

### Windows
Double-click `start.bat` or run:
```cmd
start.bat
```

> **What this does:** Automatically launches the development server and opens `http://localhost:3000` in Google Chrome.

---

## 🛠 Manual Setup for Developers

If you prefer to run commands manually in your terminal:

### 1. Prerequisites
- **Node.js**: `v20` or higher
- **npm**: `v10` or higher

### 2. Installation
Clone the repository and install dependencies inside the `app/` folder:

```bash
cd app
npm install
```

### 3. Database Setup (Zero Config - SQLite)
Copy the environment variables and initialize the local database:

```bash
# 1. Create .env file from template
cp .env.example .env

# 2. Push schema to local SQLite database (dev.db)
npm run db:push

# 3. Seed starter sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄 Database Management Commands

Run all database commands from inside the `app/` directory:

| Command | Description |
| :--- | :--- |
| `npm run db:push` | Push schema changes directly to SQLite (`dev.db`) |
| `npm run db:seed` | Populate database with sample seed data |
| `npm run db:migrate` | Create and apply a new Prisma migration |
| `npm run db:studio` | Open Prisma Studio GUI in browser to view/edit database records |

---

## 📁 Project Structure

```
city-signal/
├── start.command      # macOS 1-click startup script
├── start.bat          # Windows 1-click startup script
├── start.js           # Launch script runner
└── app/               # Next.js Application Root
    ├── app/           # Next.js App Router (pages & components)
    ├── lib/           # Shared utilities (Prisma client singleton)
    ├── prisma/        # Prisma schema and seed scripts
    │   ├── schema.prisma
    │   └── seed.ts
    ├── .env.example   # Environment template
    └── package.json
```