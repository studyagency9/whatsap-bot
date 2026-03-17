# 🚀 GUIDE RAPIDE - 5 MINUTES

## Étape 1: Installation (2 min)

```bash
cd whatsapp-bot
npm install
```

## Étape 2: Configuration (1 min)

Créer fichier `.env`:

```env
GOOGLE_API_KEY=votre-cle-google-ai-ici
ADMIN_NUMBER=221771234567
```

**Obtenir clé Google AI Studio (GRATUIT):** https://aistudio.google.com/app/apikey

## Étape 3: Personnaliser (1 min)

Modifier `business.json`:
- Nom de votre business
- Vos produits
- Vos prix

## Étape 4: Lancer (1 min)

```bash
npm start
```

Scanner le QR code avec WhatsApp → **C'EST PRÊT!** 🎉

---

## Test Rapide

Envoyez un message WhatsApp:
```
Salut, tu vends quoi?
```

Le bot répond automatiquement! 🤖

---

## Production (Serveur)

```bash
npm install -g pm2
pm2 start bot.js --name whatsapp-bot
pm2 save
```

**Terminé!** Le bot tourne 24/7 🔥

---

## Ajouter des Produits (Excel)

1. Créer `produits.xlsx` avec colonnes: id, nom, prix, description, images
2. Lancer: `npm run excel-to-json`
3. Redémarrer le bot

---

## Aide Rapide

**Voir les logs:**
```bash
pm2 logs whatsapp-bot
```

**Redémarrer:**
```bash
pm2 restart whatsapp-bot
```

**Problème?** Lire `README.md` section "Problèmes Courants"

---

**Support:** Tout est dans le README.md 📖
