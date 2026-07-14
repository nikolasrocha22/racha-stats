import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // Dev middleware to emulate the Vercel serverless function
      {
        name: 'api-ai-proxy',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end('{}');
              return;
            }
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { systemPrompt, userPrompt } = JSON.parse(body);
                const apiKey = env.NVIDIA_API_KEY;

                if (!apiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'NVIDIA_API_KEY não configurada no .env' }));
                  return;
                }

                const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                    model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 2048
                  })
                });

                if (!nvidiaRes.ok) {
                  const errText = await nvidiaRes.text();
                  res.writeHead(nvidiaRes.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: `Erro NVIDIA (${nvidiaRes.status}): ${errText.substring(0, 200)}` }));
                  return;
                }

                const data = await nvidiaRes.json();
                const content = data.choices?.[0]?.message?.content;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ content: content || '' }));
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Erro: ${err.message}` }));
              }
            });
          });
        }
      }
    ]
  }
})
