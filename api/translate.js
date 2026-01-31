
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = request.body;
  if (!text) {
    return response.status(400).json({ error: 'Missing text' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'Server API Key missing' });
  }

  try {
    const fetchResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this to Myanmar (Burmese). Output only the translation:\n\n"${text}"`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
        })
      }
    );

    if (fetchResponse.status === 429) {
        return response.status(429).json({ error: 'Rate Limited' });
    }

    const json = await fetchResponse.json();
    
    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
      let translated = json.candidates[0].content.parts[0].text.trim();
      translated = translated.replace(/^["']|["']$/g, '');
      return response.status(200).json({ translation: translated });
    } else {
        return response.status(500).json({ error: 'Invalid response from Gemini' });
    }

  } catch (err) {
    console.error('Gemini Translation Error:', err);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
