# Step-by-Step Deployment Guide

This guide walks you through deploying the Attendance Management Application live on **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                      │
│            (mohan-codebase/attendance-app)                  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
     ┌──────────────────┐            ┌──────────────────┐
     │  Vercel (CI/CD)  │            │  Render (CI/CD)  │
     │     Frontend     │            │     Backend      │
     │  (React / SPA)   │            │ (Node / Express) │
     └─────────┬────────┘            └─────────┬────────┘
               │                               │
               │  API Requests (HTTPS)         │  Mongoose (TLS)
               └───────────────────────────────┼──────────────┐
                                               ▼              ▼
                                     ┌──────────────────┐
                                     │  MongoDB Atlas   │
                                     │ (Cloud Database) │
                                     └──────────────────┘
```

---

## 📋 Pre-requisites Checklist

- [ ] A [GitHub](https://github.com/) account with this repository pushed.
- [ ] A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
- [ ] A free [Render](https://render.com) account.
- [ ] A free [Vercel](https://vercel.com) account.

---

## 🚀 Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Log into **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**.
2. **Create a Free Cluster**:
   - Click **Create Deployment** > select **M0 (Free)**.
   - Choose a cloud provider and region near your users (e.g. Mumbai / Singapore).
   - Click **Create Cluster**.

3. **Create Database User**:
   - Navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Select **Password Authentication**.
   - Set a Username (e.g., `app_admin`) and a strong Password.
   - Set privileges to **Read and write to any database**.
   - Click **Add User** (save the username and password safely).

4. **Whitelist Network Access**:
   - Navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm** *(required for cloud hosting providers like Render to connect)*.

5. **Get Connection String**:
   - Go to **Databases** > click **Connect** next to your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/attendance?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

---

## 📦 Step 2: Push Latest Code to GitHub

Make sure all changes in your workspace are committed and pushed:

```bash
git add .
git commit -m "feat: complete deployment configuration"
git push origin main
```

---

## 🖥️ Step 3: Deploy Backend on Render

1. Log into **[Render](https://render.com)** using your GitHub account.
2. In the dashboard, click **New +** > **Web Service**.
3. Select your repository: **`attendance-app`**.
4. Configure the service settings:
   - **Name**: `attendance-backend`
   - **Region**: Choose a region close to your database
   - **Root Directory**: `backend` *(⚠️ Essential)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add **Environment Variables** under the *Environment* section:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `MONGO_URI` | `mongodb+srv://<user>:<password>@...` | Your MongoDB Atlas connection URI |
   | `JWT_SECRET` | `your_secure_random_jwt_secret_key` | Secret key for JWT signing |
   | `PORT` | `5001` | Application port |
   | `CORS_ORIGIN` | `*` | Temporary wildcard (updated after frontend is live) |

6. Click **Deploy Web Service**.
7. Wait 2–3 minutes for the build to finish. Once live, copy your backend URL:
   - Example: `https://attendance-backend-xxxx.onrender.com`

---

## 🌐 Step 4: Deploy Frontend on Vercel

1. Log into **[Vercel](https://vercel.com)** with your GitHub account (`mohanavenkatesh`).
2. Click **Add New...** > **Project**.
3. Locate **`attendance-app`** under your repositories and click **Import**.
4. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click **Edit** and choose **`frontend`** *(⚠️ Essential)*

5. Expand the **Environment Variables** accordion:

   | Key | Value |
   | :--- | :--- |
   | `REACT_APP_API_URL` | `https://attendance-backend-xxxx.onrender.com` |

   *(Paste your Render backend URL without a trailing slash `/`)*

6. Click **Deploy**.
7. In ~60 seconds, Vercel will complete the build and provide your live URL:
   - Example: `https://attendance-app-xxxx.vercel.app`

---

## 🔒 Step 5: Secure CORS Configuration

1. Go back to your **Render Dashboard** > **`attendance-backend`** > **Environment**.
2. Update the `CORS_ORIGIN` value:
   - Change `*` to your exact Vercel production domain:
     ```
     https://attendance-app-xxxx.vercel.app
     ```
3. Click **Save Changes** (Render will automatically redeploy).

---

## 🛠️ Verification & Troubleshooting

### Verification Steps
1. Open your live Vercel URL in a browser.
2. Navigate to `/register` or `/login` and create an account.
3. Verify data gets saved in your MongoDB Atlas collections (`users`, `admissions`, etc.).

### Common Issues & Fixes
- **CORS Error in Browser Console**:
  - Ensure `CORS_ORIGIN` on Render exactly matches your Vercel URL (including `https://` and without trailing slash).
- **Network Error / Failed to Fetch**:
  - Check that `REACT_APP_API_URL` on Vercel is set to your Render URL.
  - Note: Free Render instances spin down after 15 minutes of inactivity; the very first request after sleep may take ~30-50 seconds to respond.
- **Page Refresh 404 on Vercel**:
  - The repository includes [`frontend/vercel.json`](frontend/vercel.json) with client-side rewrites to prevent 404 errors on direct route navigation.
