
export default async function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
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
              text: `Generate a short, powerful, inspirational daily quote about life or success. 
              Provide output in JSON format like this: {"en": "English quote here", "my": "Myanmar translation here"}`
            }]
          }],
          generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.7 
          }
        })
      }
    );

    const json = await fetchResponse.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (content) {
      const result = JSON.parse(content);
      return response.status(200).json(result);
    } else {
      return response.status(500).json({ error: 'Failed to generate content' });
    }

  } catch (err) {
    console.error("Gemini Daily Gen Error:", err);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
