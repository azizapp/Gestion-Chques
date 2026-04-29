const { readFileSync, existsSync } = require('fs');
const { extname, join } = require('path');
const { transform } = require('sucrase');

const mimeTypes = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  
  // Security: prevent directory traversal
  filePath = filePath.replace(/\.\./g, '');
  
  const baseDir = join(__dirname, '..');
  const fullPath = join(baseDir, filePath);
  const ext = extname(fullPath);

  // Serve static files
  if (existsSync(fullPath) && !ext.match(/\.tsx?$/)) {
    const mime = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(readFileSync(fullPath));
    return;
  }

  // Handle .ts/.tsx files - transpile on the fly
  if (ext === '.ts' || ext === '.tsx') {
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf8');
        const result = transform(content, {
          transforms: ['typescript', 'jsx'],
          jsxPragma: 'React.createElement',
          jsxFragmentPragma: 'React.Fragment'
        });
        
        // Inject environment variables
        let code = result.code;
        const envVars = {
          'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL || '',
          'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY || '',
          'VITE_GEMINI_API_KEY': process.env.VITE_GEMINI_API_KEY || '',
        };
        
        Object.entries(envVars).forEach(([key, val]) => {
          code = code.replace(
            new RegExp(`import\\.meta\\.env\\.${key}`, 'g'),
            JSON.stringify(val)
          );
        });

        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(code);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Transpilation error: ' + err.message);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + filePath);
    }
    return;
  }

  // Default: serve index.html (SPA routing)
  const indexPath = join(baseDir, 'index.html');
  if (existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(indexPath));
  } else {
    res.writeHead(404);
    res.end('index.html not found');
  }
};
