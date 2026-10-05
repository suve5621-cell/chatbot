const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force IPv4 first on Windows to avoid connection timeouts
dns.setDefaultResultOrder('ipv4first');

const PORT = 3000;
const SYSTEM_PROMPT = "You are SuveBot, a smart, polite, and accurate AI assistant. You support English, Tanglish (Tamil written in English letters, e.g., 'epdi irukka', 'saptingala', 'enna panra'), and Tamil. If the user speaks in Tanglish, reply warmly and naturally in Tanglish. If the user speaks in English, reply in English. If in Tamil, reply in Tamil. Provide accurate, clear, and helpful answers for math, coding, general knowledge, and writing.";

let conversationHistory = [];
let localDatabase = { categories: [] };

// Load database.json
try {
  const dbData = fs.readFileSync(path.join(__dirname, 'database.json'), 'utf8');
  localDatabase = JSON.parse(dbData);
  console.log(`Loaded ${localDatabase.categories.length} categories from database.json`);
} catch (err) {
  console.warn("Could not load database.json:", err.message);
}

// 1. Time / Date queries
function isTimeQuery(text) {
  return /\b(time|date|day|today|month|year|நேரம்|தேதி|நாள்|இன்று|கிழமை|neram|thethi|today date|current time)\b/i.test(text.trim());
}

function getLocalTimeResponse() {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  return `📅 **Date / தேதி:** ${dateStr}\n⏰ **Time / நேரம்:** ${timeStr}`;
}

// 2. Simple Math evaluation
function tryMathEval(text) {
  const cleaned = text.trim().replace(/^what\s+is\s+/i, '').replace(/\?$/, '').trim();
  const match = cleaned.match(/^(\d+(\.\d+)?)\s*([\+\-\*\/xX])\s*(\d+(\.\d+)?)$/);
  if (match) {
    const num1 = parseFloat(match[1]);
    const op = match[3].toLowerCase();
    const num2 = parseFloat(match[4]);
    let result = 0;
    if (op === '+') result = num1 + num2;
    else if (op === '-') result = num1 - num2;
    else if (op === '*' || op === 'x') result = num1 * num2;
    else if (op === '/') result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero';
    return `🧮 **Calculation:** ${num1} ${op === 'x' ? '×' : op} ${num2} = **${result}**`;
  }
  return null;
}

// 3. Search local database.json
function searchDatabase(text) {
  const lower = text.toLowerCase().trim();
  for (const cat of localDatabase.categories || []) {
    for (const item of cat.questions || []) {
      // Check exact question or close match
      const qLower = item.q.toLowerCase();
      if (lower === qLower || lower.includes(qLower) || qLower.includes(lower)) {
        return item.a;
      }
      // Check keywords
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (lower.includes(kw.toLowerCase())) {
            return item.a;
          }
        }
      }
    }
  }
  return null;
}

// 4. Query AI LLM
async function queryAI(messages) {
  const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
  const url = `https://text.pollinations.ai/${encodeURIComponent(lastUserMsg)}?system=${encodeURIComponent(SYSTEM_PROMPT)}`;

  // Fast direct GET
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) return text.trim();
    }
  } catch (err) {
    console.warn("GET failed, trying POST fallback:", err.message);
  }

  // Fallback POST
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-10)],
        model: 'openai'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) return text.trim();
    }
  } catch (err2) {
    console.warn("POST fallback failed:", err2.message);
  }

  throw new Error("AI service temporarily unavailable");
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // Endpoint to fetch questions database for frontend UI
  if (req.method === 'GET' && parsedUrl.pathname === '/api/database') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(localDatabase));
    return;
  }

  // Chat API
  if (req.method === 'POST' && parsedUrl.pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const userMsg = (data.message || '').trim();

        if (!userMsg) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply: 'Please enter a message.' }));
          return;
        }

        // Check 1: Real-time clock
        if (isTimeQuery(userMsg)) {
          const timeReply = getLocalTimeResponse();
          conversationHistory.push({ role: 'user', content: userMsg }, { role: 'assistant', content: timeReply });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply: timeReply, source: 'system_clock' }));
          return;
        }

        // Check 2: Simple math calculation
        const mathReply = tryMathEval(userMsg);
        if (mathReply) {
          conversationHistory.push({ role: 'user', content: userMsg }, { role: 'assistant', content: mathReply });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply: mathReply, source: 'math_calc' }));
          return;
        }

        // Check 3: Local Database match
        const dbReply = searchDatabase(userMsg);
        if (dbReply) {
          conversationHistory.push({ role: 'user', content: userMsg }, { role: 'assistant', content: dbReply });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply: dbReply, source: 'database' }));
          return;
        }

        // Check 4: AI LLM Query
        conversationHistory.push({ role: 'user', content: userMsg });
        try {
          const reply = await queryAI(conversationHistory);
          conversationHistory.push({ role: 'assistant', content: reply });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply, source: 'llm' }));
        } catch (aiErr) {
          conversationHistory.pop();
          console.error("AI Error:", aiErr.message);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            reply: "மன்னிக்கவும்! பதிலை உருவாக்குவதில் சிரமம் உள்ளது. நீங்கள் மேலே உள்ள 'Explore Questions' லிஸ்டில் உள்ள கேள்விகளை முயற்சி செய்யலாம் அல்லது மீண்டும் ஒருமுறை கேளுங்கள்." 
          }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply: 'Internal server error.' }));
      }
    });
    return;
  }

  // Serve index.html
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`SuveBot with Database & Multi-language (English/Tanglish/Tamil) is live at http://localhost:${PORT}`);
});
