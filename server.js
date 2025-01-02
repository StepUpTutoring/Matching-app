import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Add security headers middleware
app.use((req, res, next) => {
  // Remove COOP header that's blocking the Google Sign-in popup
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Add other security headers
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Serve static files from the dist directory with proper MIME types
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'text/javascript');
    }
  }
}));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
