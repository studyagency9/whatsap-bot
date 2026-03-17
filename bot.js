const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { getAIResponse } = require('./ai');
require('dotenv').config();

const conversationHistory = new Map();
const MAX_HISTORY = 10;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    getMessage: async (key) => {
      return { conversation: '' };
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 SCANNEZ CE QR CODE AVEC WHATSAPP:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connexion fermée. Reconnexion:', shouldReconnect);
      
      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot WhatsApp connecté et prêt! 🚀');
      console.log('📞 En attente de messages...\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const messageText = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         '';

      if (!messageText) continue;

      // Extraire le vrai numéro (enlever @s.whatsapp.net, @lid, etc.)
      const cleanNumber = from.split('@')[0];
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

      console.log(`\n📩 Message de ${formattedNumber}:`);
      console.log(`   "${messageText}"`);

      await handleIncomingMessage(sock, from, messageText, formattedNumber);
    }
  });

  return sock;
}

async function handleIncomingMessage(sock, from, messageText, formattedNumber) {
  try {
    await sock.sendPresenceUpdate('composing', from);

    // Utiliser le numéro formaté comme clé d'historique (plus stable)
    let history = conversationHistory.get(formattedNumber) || [];
    
    const aiResult = await getAIResponse(messageText, history);
    
    history.push({ role: 'user', content: messageText });
    history.push({ role: 'assistant', content: aiResult.response });
    
    if (history.length > MAX_HISTORY * 2) {
      history = history.slice(-MAX_HISTORY * 2);
    }
    conversationHistory.set(formattedNumber, history);

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    await sock.sendPresenceUpdate('paused', from);

    await sock.sendMessage(from, { text: aiResult.response });
    
    console.log(`✅ Réponse envoyée: "${aiResult.response.substring(0, 50)}..."`);

    if (aiResult.isHotLead) {
      console.log('\n🔥🔥🔥 CLIENT CHAUD DÉTECTÉ! 🔥🔥🔥');
      console.log(`   Numéro: ${formattedNumber}`);
      console.log(`   Message: "${messageText}"`);
      console.log(`   Réponse: "${aiResult.response}"\n`);
      
      await notifyAdmin(sock, formattedNumber, messageText, aiResult.response, aiResult.productMentioned);
    }

    if (aiResult.productMentioned) {
      console.log(`📦 Produit détecté: ${aiResult.productMentioned.nom}`);
      await sendProductMedia(sock, from, aiResult.productMentioned);
    }

  } catch (error) {
    console.error('❌ Erreur traitement message:', error.message);
    
    try {
      await sock.sendMessage(from, { 
        text: "Désolé, j'ai un petit problème technique. Réessaye dans un instant 🙏" 
      });
    } catch (e) {
      console.error('❌ Impossible d\'envoyer message d\'erreur');
    }
  }
}

async function sendProductMedia(sock, to, product) {
  try {
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images.slice(0, 2)) {
        if (imageUrl.startsWith('http')) {
          try {
            await sock.sendMessage(to, {
              image: { url: imageUrl },
              caption: `${product.nom}\n💰 ${product.prix.toLocaleString()} ${product.devise}\n\n${product.description}`
            });
            console.log(`📸 Image envoyée: ${product.nom}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.log(`⚠️ Image non disponible: ${imageUrl}`);
          }
        }
      }
    }

    if (product.video && product.video.startsWith('http')) {
      try {
        await sock.sendMessage(to, {
          video: { url: product.video },
          caption: `🎥 Vidéo: ${product.nom}`
        });
        console.log(`🎥 Vidéo envoyée: ${product.nom}`);
      } catch (err) {
        console.log(`⚠️ Vidéo non disponible: ${product.video}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur envoi média:', error.message);
  }
}

// Messages admin aléatoires pour éviter la répétition
function getRandomAdminMessage() {
  const messages = [
    {
      title: "� Nouvelle commande chez Chez Fatou Mode ! �",
      intro: "Un client est prêt à craquer pour notre robe ankara moderne !",
      contact: "📞 Contact :",
      demande: "🎯 Commande :",
      action: "⏰ Action recommandée : Confirme vite avant qu'il ne change d'avis !",
      compact: true
    },
    {
      title: "🎉 Hey ! Une nouvelle commande vient d'arriver ! 🎉",
      intro: "Notre cliente est fan de la robe ankara moderne et elle veut la commander !",
      contact: "📞 Téléphone :",
      demande: "� Message client :",
      action: "💌 Un petit message rapide et cette commande est à vous !",
      compact: true
    },
    {
      title: "⚡ Alerte commande express ! ⚡",
      intro: "Client intéressé par notre robe ankara moderne – prêt à acheter !",
      contact: "� Appelez-le :",
      demande: "🎯 Demande :",
      action: "� Ne perdez pas de temps, confirmez vite la vente !",
      compact: true
    },
    {
      title: "� Une commande sérieuse pour Chez Fatou Mode ! �",
      intro: "Le client est déjà rassuré par le bot et veut notre robe ankara moderne.",
      contact: "📞 Numéro :",
      demande: "💬 Message :",
      action: "✅ Tout est prêt pour conclure la vente, il suffit d'un appel !",
      compact: true
    },
    {
      title: "🚀 Ne laissez pas passer cette commande ! 🚀",
      intro: "Le client a choisi la robe ankara moderne et est prêt à acheter.",
      contact: "📞 Contact direct :",
      demande: "� Commande :",
      action: "✨ Appelez maintenant et transformez cette envie en vente !",
      compact: true
    },
    {
      title: "🎊 Coup de cœur chez Chez Fatou Mode ! 🎊",
      intro: "Une cliente a flashé sur notre robe ankara moderne !",
      contact: "📞 Téléphone :",
      demande: "💬 Message client :",
      action: "💌 Envoyez un petit message ou appelez vite, elle n'attendra pas éternellement !",
      compact: true
    }
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

async function notifyAdmin(sock, clientNumber, clientMessage, botResponse, productMentioned) {
  const adminNumber = process.env.ADMIN_NUMBER;
  
  if (!adminNumber) {
    console.log('⚠️ ADMIN_NUMBER non configuré dans .env');
    return;
  }

  try {
    const adminJid = adminNumber.includes('@') ? adminNumber : `${adminNumber}@s.whatsapp.net`;
    const msgTemplate = getRandomAdminMessage();
    
    let notification;
    
    if (msgTemplate.compact && productMentioned) {
      // Format compact pour les nouvelles versions
      notification = `${msgTemplate.title}\n\n` +
                     `${msgTemplate.intro}\n` +
                     `${msgTemplate.contact} ${clientNumber}\n` +
                     `${msgTemplate.demande} "${clientMessage}"\n\n` +
                     `💰 Prix : ${productMentioned.prix.toLocaleString()} ${productMentioned.devise}\n` +
                     `📦 Stock : ${productMentioned.stock ? 'DISPONIBLE ✅' : 'RUPTURE ❌'}\n` +
                     `🔑 Réf : ${productMentioned.id}\n\n` +
                     `${msgTemplate.action}\n\n` +
                     `⏰ ${new Date().toLocaleString('fr-FR')}`;
    } else {
      // Format standard (fallback)
      notification = `${msgTemplate.title}\n\n` +
                     `${msgTemplate.intro}\n\n` +
                     `${msgTemplate.contact} ${clientNumber}\n\n` +
                     `${msgTemplate.demande} "${clientMessage}"\n\n` +
                     `⏰ ${new Date().toLocaleString('fr-FR')}`;
      
      if (productMentioned) {
        notification += `\n\n💎 Produit : ${productMentioned.nom}\n` +
                        `💰 Prix : ${productMentioned.prix.toLocaleString()} ${productMentioned.devise}\n` +
                        `📦 Stock : ${productMentioned.stock ? 'DISPONIBLE ✅' : 'RUPTURE ❌'}\n` +
                        `🔑 Réf produit : ${productMentioned.id}`;
      }
    }

    await sock.sendMessage(adminJid, { text: notification });
    console.log('📧 Notification admin envoyée');

    // Envoyer les médias du produit à l'admin si disponibles
    if (productMentioned) {
      await sendProductMediaToAdmin(sock, adminJid, productMentioned);
    }
    
  } catch (error) {
    console.error('❌ Erreur notification admin:', error.message);
  }
}

async function sendProductMediaToAdmin(sock, adminJid, product) {
  try {
    console.log(`📤 Envoi médias du produit "${product.nom}" à l'admin`);

    // Envoyer les images
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images.slice(0, 2)) {
        if (imageUrl.startsWith('http')) {
          try {
            await sock.sendMessage(adminJid, {
              image: { url: imageUrl },
              caption: `📸 ${product.nom}\n💰 ${product.prix.toLocaleString()} ${product.devise}\n🔑 ID: ${product.id}`
            });
            console.log(`📸 Image envoyée à l'admin: ${product.nom}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre les images
          } catch (err) {
            console.log(`⚠️ Image non disponible: ${imageUrl}`);
          }
        }
      }
    }

    // Envoyer la vidéo si disponible
    if (product.video && product.video.startsWith('http')) {
      try {
        await sock.sendMessage(adminJid, {
          video: { url: product.video },
          caption: `🎥 Vidéo: ${product.nom}\n🔑 ID: ${product.id}`
        });
        console.log(`🎥 Vidéo envoyée à l'admin: ${product.nom}`);
      } catch (err) {
        console.log(`⚠️ Vidéo non disponible: ${product.video}`);
      }
    }

    console.log('✅ Médias envoyés à l\'admin avec succès');
    
  } catch (error) {
    console.error('❌ Erreur envoi médias à l\'admin:', error.message);
  }
}

async function startBot() {
  console.log('\n🤖 DÉMARRAGE DU BOT WHATSAPP...\n');
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ ERREUR: GOOGLE_API_KEY manquant dans .env');
    console.log('📝 Créez un fichier .env avec votre clé API Google AI Studio');
    process.exit(1);
  }

  if (!fs.existsSync('./business.json')) {
    console.error('❌ ERREUR: business.json introuvable');
    process.exit(1);
  }

  try {
    const { loadBusinessData } = require('./ai');
    loadBusinessData();
    
    // Démarrer le bot WhatsApp
    connectToWhatsApp().catch(err => {
      console.error('❌ Erreur connexion WhatsApp:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Serveur HTTP pour le health check de Digital Ocean
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'WhatsApp Bot Malik',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'WhatsApp Bot Malik',
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur HTTP
app.listen(PORT, () => {
  console.log(`🌐 Serveur health check démarré sur le port ${PORT}`);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesse rejetée:', error);
});

startBot();
