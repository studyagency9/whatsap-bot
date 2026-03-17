const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

// Google AI Studio (gratuit, clé API simple)
const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Vertex AI (Google Cloud, OAuth2)
const VERTEX_API_URL = 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent';
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;

let businessData = null;

function loadBusinessData() {
  try {
    const data = fs.readFileSync('./business.json', 'utf8');
    businessData = JSON.parse(data);
    console.log('✅ Données business chargées');
  } catch (error) {
    console.error('❌ Erreur chargement business.json:', error.message);
    process.exit(1);
  }
}

function buildSystemPrompt() {
  return `Tu es Malik, un vendeur cool qui gère le WhatsApp du business.

DONNÉES PRODUITS:
${JSON.stringify(businessData, null, 2)}

TON STYLE:
- Parle comme dans la vraie vie, pas comme un robot
- Phrases courtes et simples
- Ton décontracté mais respectueux
- 1 emoji max par message (ou aucun)
- Jamais de "Parfait chef! 🙏 C'est une excellente idée" → trop formel!

EXEMPLES NATURELS:

Client: "tu as des robes?"
Toi: "Ouais on a des robes ankara à 22 000, super jolies. Tu veux voir?"

Client: "je veux commander la robe"
Toi: "Ok cool, donne moi ton nom et où tu es, je prépare ça [HOT]"

Client: "c'est cher"
Toi: "Je comprends mais c'est de la qualité hein. Sinon on a d'autres modèles moins chers, tu veux voir?"

Client: "vous livrez?"
Toi: "Oui partout à Dakar en 24h. Gratuit à partir de 25 000"

RÈGLES:
- Réponds direct, pas de blabla
- Propose toujours une action après
- Si client veut acheter → ajoute [HOT] à la fin
- Jamais inventer de prix
- Max 3 lignes par réponse

Parle comme un pote qui vend, pas comme un service client.`;
}

async function callGoogleAI(conversationText) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: conversationText }]
        }
      ]
    });

    const url = new URL(`${GOOGLE_AI_URL}?key=${GOOGLE_API_KEY}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log('🔍 Google AI Status:', res.statusCode);
      let data = '';
      
      // Gérer les erreurs de service (503, 429, 500, etc.)
      if (res.statusCode >= 400) {
        if (res.statusCode === 429) {
          console.log('⚠️ Google AI: Quota dépassé (429)');
          reject(new Error('QUOTA_EXCEEDED'));
        } else if (res.statusCode === 503) {
          console.log('⚠️ Google AI: Service indisponible (503)');
          reject(new Error('SERVICE_UNAVAILABLE'));
        } else if (res.statusCode >= 500) {
          console.log('⚠️ Google AI: Erreur serveur');
          reject(new Error('SERVICE_ERROR'));
        } else {
          console.log('⚠️ Google AI: Erreur client');
          reject(new Error('CLIENT_ERROR'));
        }
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Google AI Studio renvoie un objet JSON simple: {...}
          const response = JSON.parse(data);
          
          if (response.candidates && response.candidates[0]?.content?.parts) {
            let fullText = '';
            for (const part of response.candidates[0].content.parts) {
              if (part.text) {
                fullText += part.text;
              }
            }
            
            if (fullText.trim()) {
              console.log('✅ Google AI Studio OK');
              resolve(fullText.trim());
            } else {
              console.log('❌ Google AI: Aucun texte extrait');
              reject(new Error('Aucun texte extrait de Google AI'));
            }
          } else {
            console.log('❌ Google AI: Erreur de format');
            reject(new Error('Format de réponse Google AI inattendu'));
          }
        } catch (e) {
          console.log('❌ Google AI: Erreur de traitement');
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Google AI Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function callVertexAI(conversationText) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: conversationText }]
        }
      ]
    });

    const url = new URL(`${VERTEX_API_URL}?key=${VERTEX_API_KEY}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          let fullText = '';
          
          // Vertex AI renvoie un tableau JSON: [{...},{...}]
          // Parser comme un tableau
          try {
            const jsonArray = JSON.parse(data);
            if (Array.isArray(jsonArray)) {
              for (const item of jsonArray) {
                if (item.candidates && item.candidates[0]?.content?.parts) {
                  for (const part of item.candidates[0].content.parts) {
                    if (part.text) {
                      fullText += part.text;
                    }
                  }
                }
              }
            }
          } catch (arrayError) {
            // Si ce n'est pas un tableau, essayer comme objet unique
            const singleJson = JSON.parse(data);
            if (singleJson.candidates && singleJson.candidates[0]?.content?.parts) {
              for (const part of singleJson.candidates[0].content.parts) {
                if (part.text) {
                  fullText += part.text;
                }
              }
            }
          }
          
          if (fullText.trim()) {
            resolve(fullText.trim());
          } else {
            console.log('❌ Aucun texte extrait de Vertex AI');
            resolve('Désolé, j\'ai un petit souci technique. Réessaye dans quelques secondes 🙏');
          }
        } catch (e) {
          console.log('❌ Erreur traitement Vertex AI:', e.message);
          resolve('Désolé, j\'ai un petit souci technique. Réessaye dans quelques secondes 🙏');
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function getAIResponse(userMessage, conversationHistory = []) {
  try {
    if (!businessData) {
      loadBusinessData();
    }

    let conversationText = buildSystemPrompt() + '\n\n';
    
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        conversationText += `Client: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationText += `Vendeur: ${msg.content}\n`;
      }
    }
    
    conversationText += `Client: ${userMessage}\nVendeur:`;

    let response;
    let aiProvider = 'Google AI Studio (Gemini 2.5 Flash Lite)';

    // Utiliser Google AI Studio en premier (principal)
    try {
      response = await callGoogleAI(conversationText);
      console.log('✅ Réponse de Google AI Studio');
    } catch (googleError) {
      // Gérer les différents types d'erreurs Google AI
      if (googleError.message === 'QUOTA_EXCEEDED') {
        console.log('🔄 Quota Google AI atteint, utilisation de Vertex AI');
      } else if (googleError.message === 'SERVICE_UNAVAILABLE') {
        console.log('🔄 Google AI service 503, utilisation de Vertex AI');
      } else if (googleError.message === 'SERVICE_ERROR') {
        console.log('🔄 Google AI serveur erreur, utilisation de Vertex AI');
      } else {
        console.log('⚠️ Google AI Studio indisponible, bascule vers Vertex AI...');
      }
      
      // Fallback vers Vertex AI si Google AI échoue
      if (VERTEX_API_KEY) {
        try {
          response = await callVertexAI(conversationText);
          aiProvider = 'Vertex AI (fallback)';
          console.log('✅ Réponse de Vertex AI');
        } catch (vertexError) {
          console.error('❌ Vertex AI aussi en erreur');
          throw new Error('Les deux services IA sont indisponibles');
        }
      } else {
        throw new Error('Google AI indisponible et Vertex AI non configuré');
      }
    }
    
    const isHotLead = response.includes('[HOT]');
    const cleanResponse = response.replace('[HOT]', '').trim();

    return {
      response: cleanResponse,
      isHotLead: isHotLead,
      productMentioned: detectProductMention(userMessage, response),
      aiProvider: aiProvider
    };

  } catch (error) {
    console.error('❌ Erreur IA:', error.message);
    return {
      response: "Désolé, j'ai un petit souci technique. Réessaye dans quelques secondes 🙏",
      isHotLead: false,
      productMentioned: null,
      aiProvider: 'Erreur'
    };
  }
}

function detectProductMention(userMessage, aiResponse) {
  if (!businessData || !businessData.produits) return null;

  const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
  
  // Mots-clés qui indiquent une demande d'images/vidéos
  const imageKeywords = ['photo', 'image', 'voir', 'montre', 'vidéo', 'démonstration', 'exemple', 'visuel', 'regard'];
  const wantsImages = imageKeywords.some(keyword => combinedText.includes(keyword));

  // Si le client ne demande pas d'images, ne pas détecter de produit
  if (!wantsImages) {
    return null;
  }

  // Trouver le produit le plus pertinent
  let bestMatch = null;
  let bestScore = 0;

  for (const produit of businessData.produits) {
    const nomLower = produit.nom.toLowerCase();
    let score = 0;
    
    // Score basé sur les mots exacts
    const mots = nomLower.split(' ');
    for (const mot of mots) {
      if (mot.length > 3 && combinedText.includes(mot)) {
        score += 2; // +2 points pour mot exact
      }
    }
    
    // Score bonus pour correspondance ID
    if (combinedText.includes(produit.id.toLowerCase())) {
      score += 5; // +5 points pour ID exact
    }
    
    // Score bonus pour correspondance partielle du nom
    if (combinedText.includes(nomLower)) {
      score += 3; // +3 points pour nom complet
    }
    
    // Garder le meilleur score
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = produit;
    }
  }

  console.log(`🎯 Détection produit: ${bestMatch ? bestMatch.nom : 'aucun'} (score: ${bestScore})`);
  return bestMatch;
}

function getProductById(productId) {
  if (!businessData || !businessData.produits) return null;
  return businessData.produits.find(p => p.id === productId);
}

function getAllProducts() {
  if (!businessData || !businessData.produits) return [];
  return businessData.produits;
}

module.exports = {
  loadBusinessData,
  getAIResponse,
  detectProductMention,
  getProductById,
  getAllProducts
};
