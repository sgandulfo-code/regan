import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`
);

app.use(express.json());

// OAuth URL Endpoint
app.get("/api/auth/google/url", (req, res) => {
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
});

// OAuth Callback Endpoint
app.get("/auth/google/callback", async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Save tokens to Supabase profiles table
    // We assume the column 'google_auth' exists (will add it in a migration)
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
            .card { background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; }
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
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// API to create a calendar event
app.post("/api/calendar/event", async (req, res) => {
  const { userId, event } = req.body;

  if (!userId || !event) {
    return res.status(400).json({ error: 'userId and event are required' });
  }

  try {
    // Get tokens from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('google_auth')
      .eq('id', userId)
      .single();

    if (error || !profile?.google_auth) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    oauth2Client.setCredentials(profile.google_auth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Calendar Event Error:', error);
    
    // Handle token expiry / invalidation
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Calendar session expired' });
    }

    res.status(500).json({ error: 'Failed to create event' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
