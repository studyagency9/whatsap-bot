const https = require('https');

const prompt = `Tu es Malik, un vendeur cool qui gère le WhatsApp du business.

DONNÉES PRODUITS:
{"produits": [{"id": "P001", "nom": "Boubou homme brodé", "prix": 35000, "devise": "FCFA"}]}

TON STYLE:
- Parle comme dans la vraie vie

Client: "Bonsoir à vous"
Vendeur:`;

const postData = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }]
});

const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=AIzaSyCFKjNGYXFxVm21huzOp_JLrS1qUROYd8M`);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('OK - Réponse:', json.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de texte');
    } catch(e) {
      console.log('Erreur parsing:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.log('Erreur:', e.message));
req.write(postData);
req.end();
