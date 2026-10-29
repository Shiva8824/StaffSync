# StaffSync — Render.com Deployment Guide

This guide walks you step-by-step through deploying **StaffSync** onto [Render.com](https://render.com) for production or project submission.

---

## 📋 Prerequisites
1. A free account on [Render.com](https://render.com).
2. A free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
3. Your StaffSync project repository pushed to your **GitHub** account.

---

## 🗄️ Step 1: Set Up Free MongoDB Atlas Database (2 minutes)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Database** → Choose the **M0 Free Cluster**.
3. Under **Security Quickstart**:
   - Create a database user (e.g., username: `staffsync_admin`, password: `YourStrongPassword123!`). Save this password!
4. **Network Access (CRITICAL)**:
   - In the left sidebar, click **Network Access** → **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) → Click **Confirm**.
   *(If you skip this step, Render will not be able to connect to MongoDB).*
5. **Get Your Connection String**:
   - Go to **Database** → Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://staffsync_admin:<password>@cluster0.abcde.mongodb.net/staffsync?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and ensure `/staffsync` database name is included.

---

## 🚀 Step 2: Deploy on Render as a Single Web Service (Recommended)

StaffSync is pre-configured to build the React frontend and serve it directly from the Express backend, allowing you to run the entire full-stack app on a **single free Render Web Service**.

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`futureSkillsProject1` or `StaffSync`).
4. Configure the service settings:
   - **Name:** `staffsync-hrms` (or any name you prefer)
   - **Region:** Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt`)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

5. **Environment Variables**:
   Click **Add Environment Variable** and enter the following keys and values:

   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & client serving |
   | `PORT` | `10000` | Standard Render web port |
   | `MONGODB_URI` | `mongodb+srv://staffsync_admin:password@cluster...` | Your MongoDB Atlas connection URI from Step 1 |
   | `JWT_SECRET` | `staffsync_super_secret_jwt_key_2025_prod_release` | Any secure random string (at least 32 characters) |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |

6. Click **Deploy Web Service**!

---

## ⚡ What Happens Automatically on Deployment:
1. Render runs `npm run build`:
   - Installs server dependencies.
   - Installs client dependencies.
   - Compiles and bundles the React app into `client/dist/`.
2. Render runs `npm start`:
   - Starts Express on the assigned port.
   - Connects to your MongoDB Atlas cluster.
   - **Auto-Seed Feature:** Detects that the database is blank and automatically provisions the demo accounts (`hr@staffsync.com`, `manager@staffsync.com`, `employee@staffsync.com`) and sample data!
   - Express serves the React SPA and handles all `/api` endpoints seamlessly.

---

## 🧪 Step 3: Verify Your Deployment
Once the deployment status shows **Live** (usually 2-3 minutes):
1. Click your Render service URL (e.g. `https://staffsync-hrms.onrender.com`).
2. Verify the landing page loads with modern styling.
3. Click **Sign In** → Use the **1-Click Demo Buttons** to sign in as **HR Admin** (`hr@staffsync.com`).
4. Test Punching attendance, creating an employee, applying for leave, and checking notifications.

---

## 🛠️ Common Render Gotchas & Solutions

| Issue | Cause | Solution |
|---|---|---|
| **Build times out** | Free tier memory limit | Run `npm run build` locally first to verify there are no compilation errors (already verified ✅). |
| **Database connection error** | Atlas IP Access not whitelisted | In MongoDB Atlas, go to **Network Access** and ensure `0.0.0.0/0` is active. |
| **App sleeps after inactivity** | Render Free Tier spins down after 15 mins idle | It takes ~30 seconds to wake up on the first visit. This is expected behavior on the free tier. |
| **Cannot log in on fresh database** | Blank database without accounts | StaffSync includes **built-in auto-seeding** on boot when 0 users are detected. Alternatively, you can use the Render Shell tab to run `npm run seed`. |
