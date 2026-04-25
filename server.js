
const express = require('express');
const path = require('path');
const fs = require('fs');
const { transform } = require('sucrase');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Simple In-memory cache for transpiled files to boost performance
const transpileCache = new Map();

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 1. CORS & Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 2. Optimized Transpilation with Caching
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (ext === '.ts' || ext === '.tsx') {
    const filePath = path.join(__dirname, req.path);

    // Check cache first
    if (transpileCache.has(filePath)) {
      res.set('Content-Type', 'application/javascript');
      return res.send(transpileCache.get(filePath));
    }

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = transform(content, {
          transforms: ['typescript', 'jsx'],
          production: true,
          jsxPragma: 'React.createElement',
          jsxFragmentPragma: 'React.Fragment'
        });

        let code = result.code;

        // Inject essential environment variables into the client-side code.
        const envKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
        envKeys.forEach(key => {
          const val = process.env[key] || '';
          const regex = new RegExp(`process\\.env\\.${key}`, 'g');
          code = code.replace(regex, JSON.stringify(val));
        });

        // Inject import.meta.env.VITE_* variables used by client-side code
        const viteEnvMap = {
          'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
          'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
        };
        Object.entries(viteEnvMap).forEach(([key, val]) => {
          code = code.replace(
            new RegExp(`import\\.meta\\.env\\.${key}`, 'g'),
            JSON.stringify(val)
          );
        });

        // Save to cache
        transpileCache.set(filePath, code);

        res.set('Content-Type', 'application/javascript');
        return res.send(code);
      } catch (err) {
        console.error(`Transpilation error for ${req.path}:`, err);
        res.set('Content-Type', 'application/javascript');
        return res.status(500).send(`/* Transpilation Error: ${err.message} */`);
      }
    } else {
      console.warn(`File not found: ${filePath}`);
      return res.status(404).set('Content-Type', 'text/plain').send('File not found');
    }
  }
  next();
});

// 3. Static Files
app.use(express.static(__dirname));

// 4. SPA Routing
app.get('*', (req, res) => {
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('Resource not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Server listening on port ${port}`);
});
