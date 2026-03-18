import express from "express";
import path from "path";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Supabase client with service role for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// We'll initialize oauth2Client inside the routes to be more resilient to missing env vars
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Please check your Vercel Environment Variables.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

const app = express();
app.use(express.json());

// API Routes
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Express server is working on Vercel",
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });
});

app.get("/api/auth/google/url", (req, res) => {
  console.log('API: Requesting Google Auth URL');
  try {
    const oauth2Client = getOAuth2Client();
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId
    });

    res.json({ url });
  } catch (error: any) {
    console.error('API Error (Auth URL):', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/calendar/event", async (req, res) => {
  console.log('API: Creating calendar event');
  const { userId, event } = req.body;

  if (!userId || !event) {
    return res.status(400).json({ error: 'userId and event are required' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('google_auth')
      .eq('id', userId)
      .single();

    if (error || !profile?.google_auth) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(profile.google_auth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('API Error (Calendar):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for API routes that don't match
app.all("/api/*", (req, res) => {
  console.log(`API: 404 Not Found - ${req.method} ${req.url}`);
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// OAuth Callback Endpoint
app.get("/auth/google/callback", async (req, res) => {
  console.log('API: Google OAuth callback received');
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    
    const { error } = await supabase
      .from('profiles')
      .update({ google_auth: tokens })
      .eq('id', userId);

    if (error) throw error;

    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>¡Conexión Exitosa!</h2>
            <p>Google Calendar se ha conectado correctamente. Esta ventana se cerrará automáticamente.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 2000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('API Error (OAuth Callback):', error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Local development server logic
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const startLocalServer = async () => {
    const { createServer: createViteServer } = await import("vite");
    console.log('Starting Vite in middleware mode for local development...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Local server running on http://localhost:${PORT}`);
    });
  };
  startLocalServer().catch(err => console.error('Failed to start local server:', err));
}

// Export app for Vercel
export default app;
