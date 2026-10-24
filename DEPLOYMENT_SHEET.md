# 🚀 COLLEGE TIMETABLE SYSTEM — RENDER DEPLOYMENT SHEET

This document contains the complete specification, environment configuration, and step-by-step procedures to deploy the College Timetable Management System on **Render**.

---

## 📋 1. Service Specifications

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Hosting Platform** | [Render](https://render.com) | Free Tier Compatible |
| **Service Type** | Web Service | Unified Frontend + Backend (Single Service) |
| **Runtime Environment** | Node.js | v18+ or v20+ |
| **Region** | Singapore / Frankfurt / Oregon | Choose closest to your location |
| **Branch** | `main` | Default production branch |
| **Root Directory** | *(Leave blank / repository root)* | Uses root `package.json` |
| **Build Command** | `npm run build` | Builds React SPA (`client/dist`) and installs dependencies |
| **Start Command** | `npm start` | Launches Express server (`backend/server.js`) |
| **Health Check Path** | `/api/settings` or `/` | Returns HTTP 200 |

---

## 🔑 2. Environment Variables Reference

Configure these in the **Environment** section of your Render Web Service:

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations & static asset serving |
| `PORT` | **Yes** | `10000` | Port assigned by Render (automatically exposed) |
| `MONGODB_URI` | **Yes** | `mongodb+srv://admin:<password>@cluster0.xxxx.mongodb.net/college-timetable?retryWrites=true&w=majority` | Cloud MongoDB Atlas database connection string |
| `JWT_SECRET` | **Yes** | `super_secret_college_timetable_jwt_key_2026` | Secret key used to sign authentication tokens |

mongodb+srv://arivazhagnbe:oZ8Zn82rG0d3FwmL@cluster0.wtrqo.mongodb.net/

---

## 🛠️ 3. Step-by-Step Deployment Procedure

### PHASE A: Cloud Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign in/register for free.
2. Click **Create** and select the **M0 Free Shared Cluster**.
3. Under **Security → Database Access**:
   - Click **Add New Database User**.
   - Create a user with password (e.g. `timetable_admin` / `<secure-password>`).
   - Assign built-in role: `Read and write to any database`.
4. Under **Security → Network Access**:
   - Click **Add IP Address**.
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render servers can connect.
5. Under **Deployment → Database**:
   - Click **Connect** → choose **Drivers** (Node.js).
   - Copy the connection string and replace `<password>` with your actual password.
   - Example:
     ```
     mongodb+srv://timetable_admin:MyPass123@cluster0.abcde.mongodb.net/college-timetable?retryWrites=true&w=majority
     ```

---

### PHASE B: Push Code to GitHub
Open your terminal in `e:\ari\college-timetable` and run:

```powershell
# 1. Verify git status
git status

# 2. Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/college-timetable.git

# 3. Rename branch to main
git branch -M main

# 4. Push all code to GitHub
git push -u origin main
```

---

### PHASE C: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → select **Web Service**.
3. Choose **Build and deploy from a Git repository** → select your `college-timetable` repository.
4. Render will auto-detect settings from `render.yaml`:
   * **Name:** `college-timetable`
   * **Language:** `Node`
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and add:
   * `NODE_ENV` = `production`
   * `MONGODB_URI` = *(Your MongoDB Atlas URI from Phase A)*
   * `JWT_SECRET` = *(Any random string, or click Generate)*
6. Click **Deploy Web Service**.

---

## ⚡ 4. Automatic Cold-Boot Seeding
When the application starts for the first time against an empty MongoDB Atlas database:
* `server.js` automatically detects 0 records in the database.
* It executes `backend/utils/seeder.js` automatically.
* All **14 Mathematics faculty members**, **18 class batches**, **58 subjects**, and **allocations** are seeded instantly.
* You do **not** need to run any manual database commands!

---

## 👤 5. Default Login Credentials

| Role | Identifier / Email | Default Password / Flow |
| :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `admin123` |
| **Faculty (Staff)** | Staff Short Name / Registered Email | Mobile/Email OTP verification flow |

---

## 🔍 6. Post-Deployment Verification Checklist

- [ ] Open the Render URL (e.g., `https://college-timetable.onrender.com`).
- [ ] Verify the Login screen renders with dark glassmorphism UI.
- [ ] Log in using Admin credentials (`admin@college.edu` / `admin123`).
- [ ] Navigate to **Master Timetable** in the sidebar.
- [ ] Verify both **Class-Wise**, **Staff-Wise**, and **Department-Wide** views display the generated timetable.
- [ ] Click **Generate Timetable** in the Generator tab to test the 80ms backtracking solver in the cloud.
- [ ] Click **Print Layout** to confirm clean printable output.

---

## 🚨 7. Common Issues & Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **MongoDB connection timeout / MongooseServerSelectionError** | IP address not whitelisted in Atlas | Go to Atlas → Network Access → Add `0.0.0.0/0`. |
| **Application shows white screen on direct link refresh** | Client-side routing not caught | Express catch-all `app.get('*')` in `server.js` is already configured to serve `index.html`. |
| **PayloadTooLargeError on Timetable Save** | Default Express JSON limit exceeded | Already resolved: body parser limit is set to `50mb`. |
| **Free tier spins down after inactivity** | Render free tier sleeps after 15 min | Takes ~30-50s to wake up on first request. This is normal for free instances. |
