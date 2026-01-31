import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myanmarText, setMyanmarText] = useState('');
  const [translating, setTranslating] = useState(false);

  // Reusable Translation Function (Returns text instead of setting state directly)
  const getTranslation = async (text) => {
    if (!text) return '';
    // REVERTED: Direct Client-Side Call for Local Dev
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Try Gemini first
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const response = await fetch(
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

        if (response.status === 429) throw new Error('Rate Limited');

        const json = await response.json();
        if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
          let translated = json.candidates[0].content.parts[0].text.trim();
          return translated.replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        console.log('Gemini failed, trying fallback:', err);
      }
    }
    
    // Fallback to MyMemory
    try {
      const encodedText = encodeURIComponent(text);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|my`);
      const json = await res.json();
      if (json.responseStatus === 200) return json.responseData.translatedText;
    } catch (err) {
      console.error('All translation methods failed:', err);
    }
    
    return 'ဘာသာပြန်၍မရပါ'; // Return error text if all failed
  };

  // Helper to handle Random Advice translation
  const translateRandomAdvice = async (text) => {
    setTranslating(true);
    const result = await getTranslation(text);
    setMyanmarText(result);
    setTranslating(false);
  };



  const fetchAdvice = async () => {
    setLoading(true);
    setMyanmarText('');
    
    try {
      const res = await fetch('https://api.adviceslip.com/advice');
      const json = await res.json();
      setData(json.slip);
      translateRandomAdvice(json.slip.advice); // Non-blocking translation
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <main className="min-h-screen bg-primary flex flex-col items-center justify-start p-8 md:p-12 gap-8">
      {/* Main Random Advice Card */}
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-default p-8 md:p-8 lg:p-16">
          <p className="font-mono text-xs md:text-sm text-muted tracking-widest uppercase mb-12 md:mb-16">
            Advice #{data?.id || "000"}
          </p>

          <div className="mb-8 md:mb-12 space-y-6">
            {loading ? (
              <p className="text-xl md:text-2xl text-muted">Loading...</p>
            ) : (
              <>
                <div>
                  <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">English</p>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-primary tracking-tight">
                    "{data?.advice}"
                  </h1>
                </div>
                <div className="w-12 h-px bg-elevated"></div>
                <div>
                  <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">မြန်မာ</p>
                  <p className={`text-lg md:text-xl lg:text-2xl leading-relaxed font-myanmar ${translating ? 'text-muted' : 'text-secondary'}`}>
                    {translating ? 'ဘာသာပြန်နေသည်...' : `"${myanmarText}"`}
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={fetchAdvice}
            disabled={loading || translating}
            className="font-mono text-sm md:text-base uppercase tracking-widest px-8 md:px-12 py-4 md:py-5 border border-accent text-accent bg-transparent hover:bg-primary hover:text-primary transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {loading ? 'Wait...' : 'New Advice'}
          </button>
        </div>
      </div>
      <p className="font-mono text-[10px] md:text-xs text-muted mt-4 tracking-wider">
        POWERED BY GEMINI AI
      </p>
    </main>
  )
}

export default App