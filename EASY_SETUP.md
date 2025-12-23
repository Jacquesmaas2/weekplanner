# SQLite Setup - Easy Web-Based Method

Since the CLI installation had issues, here's the easiest way to set up cloud SQLite:

## Step 1: Sign up for Turso (1 minute)

1. Go to https://turso.tech
2. Click "Sign up" and use GitHub login
3. You'll see the dashboard

## Step 2: Create Database (via web dashboard)

1. Click "Create Database"
2. Name it: `weekplanner`
3. Choose closest region
4. Click "Create"

## Step 3: Get Credentials (copy from dashboard)

1. Click on your `weekplanner` database
2. You'll see:
   - **Database URL**: `libsql://weekplanner-[yourname].turso.io`
   - Click "Create Token" → Copy the token

## Step 4: Update .env File

Open `.env` in the project and replace:

```env
# VITE_LIBSQL_URL=libsql://your-database.turso.io
# VITE_LIBSQL_TOKEN=your-token-here
```

With your actual values (remove the `#` to uncomment):

```env
VITE_LIBSQL_URL=libsql://weekplanner-yourname.turso.io
VITE_LIBSQL_TOKEN=eyJhbGc...your-actual-token
```

## Step 5: Test It

```powershell
npm run dev
```

Open browser console - you should see the app connect to Turso and migrate your data!

## Step 6: GitHub Pages Setup

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these two secrets:
   - Name: `VITE_LIBSQL_URL` → Value: (your URL from step 3)
   - Name: `VITE_LIBSQL_TOKEN` → Value: (your token from step 3)
3. Push to main → GitHub Actions will deploy with cloud storage

## Current State

- ✅ Code is ready for cloud SQLite
- ✅ Falls back to localStorage if no credentials
- ⏳ You just need to add Turso credentials to `.env`

The app works perfectly now with localStorage, and will automatically switch to cloud storage once you add the credentials!
