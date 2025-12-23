# SQLite/Turso Setup Guide

## Local Development Setup

1. **Install Turso CLI** (if not already installed):
   ```powershell
   irm get.turso.tech/install.ps1 | iex
   ```

2. **Sign up / Login to Turso**:
   ```powershell
   turso auth signup
   ```

3. **Create a database**:
   ```powershell
   turso db create weekplanner-db
   ```

4. **Get your database URL**:
   ```powershell
   turso db show weekplanner-db --url
   ```
   Copy the URL (e.g., `libsql://weekplanner-db-yourname.turso.io`)

5. **Create an auth token**:
   ```powershell
   turso db tokens create weekplanner-db
   ```
   Copy the token (long string starting with `eyJ...`)

6. **Update `.env` file**:
   Open `.env` in the project root and replace:
   ```
   VITE_LIBSQL_URL=your-database-url-here
   VITE_LIBSQL_TOKEN=your-auth-token-here
   ```
   With your actual URL and token.

7. **Start the dev server**:
   ```powershell
   npm run dev
   ```
   Your existing localStorage data will be automatically migrated to Turso on first load!

## GitHub Pages Deployment Setup

1. **Go to your GitHub repository** → Settings → Secrets and variables → Actions

2. **Add two secrets**:
   - Name: `VITE_LIBSQL_URL`  
     Value: Your Turso database URL (from step 4 above)
   
   - Name: `VITE_LIBSQL_TOKEN`  
     Value: Your Turso auth token (from step 5 above)

3. **Push to main branch** - GitHub Actions will automatically build and deploy with the secrets

## Verification

After setup, your app will:
- ✅ Use the same database from any device
- ✅ Sync data automatically between this PC and GitHub Pages
- ✅ Preserve all existing tasks, persons, and completions (migrated once)

## Turso Free Tier

- 9 GB storage
- 500 databases
- 1 billion row reads/month
- Perfect for this family app!

## Troubleshooting

**App still using localStorage?**
- Check that `.env` file exists in project root
- Verify env variables are set correctly (no quotes needed)
- Restart dev server after changing `.env`

**GitHub Pages not syncing?**
- Verify secrets are set in GitHub repository settings
- Check GitHub Actions logs for build errors
- Ensure CORS is enabled on Turso (it's enabled by default)

**Migration not working?**
- The app auto-migrates localStorage → SQLite on first run
- Check browser console for any errors
- You can manually verify data in Turso:
  ```powershell
  turso db shell weekplanner-db
  SELECT * FROM persons;
  SELECT * FROM tasks;
  ```
