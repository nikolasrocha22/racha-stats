export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY não configurada no servidor. Adicione nas variáveis de ambiente do Vercel.' });
  }

  const { systemPrompt, userPrompt } = req.body;
  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'systemPrompt e userPrompt são obrigatórios.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`NVIDIA API error: ${response.status} - ${errText}`);
      return res.status(response.status).json({
        error: `Erro na API NVIDIA (${response.status}): ${errText.substring(0, 200)}`
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Resposta vazia da API NVIDIA.' });
    }

    return res.status(200).json({ content });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout: a API NVIDIA demorou mais de 60 segundos para responder.' });
    }
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: `Erro interno: ${err.message}` });
  }
}
