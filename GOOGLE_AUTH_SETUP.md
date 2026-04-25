# Google OAuth Setup Guide for Mirror

## Prerequisites
Your Supabase project is already configured with:
- **Project URL**: `https://odarxmjdjhgkperiwejk.supabase.co`
- **Anon Key**: Already in `.env.local`

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google+ API**:
   - Search for "Google+ API" in the search bar
   - Click it and select **Enable**
4. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**
   - User Type: Select **External**
   - Fill in the app information:
     - App name: `Mirror`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
5. **Create OAuth 2.0 Client ID**:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `Mirror Web Client`
   - Add Authorized redirect URIs:
     ```
     https://odarxmjdjhgkperiwejk.supabase.co/auth/v1/callback
     ```
   - Click **Create**
6. **Copy your credentials**:
   - Client ID: `xxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxxxxxxxxxxxxxxxxx`

## Step 2: Add Credentials to Supabase

1. **Go to Supabase**: https://app.supabase.com/
2. **Select your project** (the one with URL: odarxmjdjhgkperiwejk.supabase.co)
3. **Go to Settings** → **Authentication** → **Providers**
4. **Find Google** in the list and click it
5. **Enable Google**:
   - Paste your **Client ID** from Google
   - Paste your **Client Secret** from Google
6. **Save**

## Step 3: Testing

Once configured, you can test Google login on:
- **Login page**: `http://localhost:3000/login`
- **Signup page**: `http://localhost:3000/signup`

Click the **Google** button to test the OAuth flow.

## Important Notes

- The redirect URI must match exactly what's configured in Google Cloud
- For local development, add both callback URLs in Supabase redirect allow list:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/v1/callback`
- Google OAuth will work for both login and signup flows
- Sessions are automatically managed through Supabase Auth

## Troubleshooting

**"Invalid Client ID" error**:
- Verify the Client ID is correct
- Check that the redirect URI in Google matches Supabase exactly

**Redirect loop**:
- Make sure `http://localhost:3000/auth/callback` is added to Google OAuth URIs if testing locally

**"Unauthorized" error**:
- Check the Client Secret is correct
- Verify the project in Google Cloud matches your OAuth app
