# 🤖 Chatbot WhatsApp Intelligent avec IA

Bot WhatsApp automatique qui répond comme un vendeur africain professionnel. Utilise Google AI Studio (Gemini) pour des réponses naturelles et intelligentes.

---

## 🎯 Fonctionnalités

✅ Réponses automatiques intelligentes (IA)  
✅ Ton naturel de vendeur africain  
✅ Envoi automatique d'images et vidéos produits  
✅ Détection clients chauds (prêts à acheter)  
✅ Historique de conversation  
✅ Notification admin pour leads importants  
✅ Pas de base de données (fichier JSON simple)  
✅ Prêt pour production  

---

## 📦 Installation Rapide

### 1. Prérequis

- Node.js 16+ installé
- Compte Google AI Studio avec clé API (gratuit)
- Numéro WhatsApp (pas WhatsApp Business API)

### 2. Installation

```bash
# Cloner ou télécharger le projet
cd whatsapp-bot

# Installer les dépendances
npm install
```

### 3. Configuration

Créer un fichier `.env` à la racine :

```env
GOOGLE_API_KEY=votre-cle-google-ai-ici
VERTEX_API_KEY=votre-cle-vertex-ai-ici
ADMIN_NUMBER=221771234567
BOT_NAME=Fatou
```

**Comment obtenir la clé Google AI Studio:**
1. Aller sur https://aistudio.google.com/app/apikey
2. Se connecter avec un compte Google
3. Cliquer sur "Create API Key"
4. Copier la clé
5. Coller dans `.env`

**Comment obtenir la clé Vertex AI (optionnel mais recommandé):**
1. Aller sur https://aistudio.google.com/app/apikey
2. Créer une autre clé API ou utiliser la même
3. Coller dans `.env` comme `VERTEX_API_KEY`

**🔥 Système de Fallback Automatique:**
- ✅ **Principal:** Google AI Studio (Gemini 1.5 Flash)
- ✅ **Fallback:** Vertex AI (Gemini 2.5 Flash Lite - plus rapide!)
- ✅ Si Google AI Studio échoue → bascule automatique vers Vertex AI
- ✅ Double fiabilité, zéro interruption

**Avantages:**
- ✅ Gratuit (quota généreux)
- ✅ Pas de carte bancaire requise
- ✅ Gemini 2.5 Flash Lite ultra-rapide

**Format ADMIN_NUMBER:**
- Sans le `+`
- Sans espaces
- Exemple: `221771234567` pour +221 77 123 45 67

### 4. Personnaliser vos produits

Modifier le fichier `business.json` avec vos informations :

```json
{
  "nom_business": "Votre Business",
  "description": "Ce que vous vendez",
  "telephone": "+221 XX XXX XX XX",
  "produits": [
    {
      "id": "P001",
      "nom": "Nom produit",
      "prix": 25000,
      "devise": "FCFA",
      "description": "Description",
      "images": ["https://lien-image.jpg"],
      "video": "https://lien-video.mp4"
    }
  ]
}
```

---

## 🚀 Lancement

### Mode Test (local)

```bash
npm start
```

1. Un QR code s'affiche
2. Scannez avec WhatsApp (Paramètres > Appareils connectés)
3. Le bot est actif!

### Mode Production (serveur)

Utiliser PM2 pour garder le bot actif 24/7:

```bash
# Installer PM2
npm install -g pm2

# Lancer le bot
pm2 start bot.js --name whatsapp-bot

# Voir les logs
pm2 logs whatsapp-bot

# Redémarrer
pm2 restart whatsapp-bot

# Arrêter
pm2 stop whatsapp-bot

# Auto-démarrage au reboot serveur
pm2 startup
pm2 save
```

---

## 🖥️ Déploiement DigitalOcean

### 1. Créer un Droplet

- Ubuntu 22.04
- Plan Basic ($6/mois suffit)
- Datacenter proche de vous

### 2. Se connecter en SSH

```bash
ssh root@votre-ip-serveur
```

### 3. Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
node --version
```

### 4. Installer le bot

```bash
# Créer dossier
mkdir /root/whatsapp-bot
cd /root/whatsapp-bot

# Uploader vos fichiers (via SFTP ou git)
# Ou copier manuellement avec nano/vim

# Installer dépendances
npm install

# Créer .env
nano .env
# (coller votre config et sauvegarder: Ctrl+X, Y, Enter)
```

### 5. Lancer avec PM2

```bash
npm install -g pm2
pm2 start bot.js --name whatsapp-bot
pm2 startup
pm2 save
```

### 6. Scanner le QR Code

```bash
pm2 logs whatsapp-bot
```

Le QR code s'affiche dans les logs. Scannez-le avec WhatsApp.

**Astuce:** Si vous ne voyez pas le QR code:
- Utilisez un outil comme `screen` ou `tmux`
- Ou connectez-vous via VNC pour voir l'interface graphique

---

## 📱 Utilisation

### Test du bot

Envoyez un message WhatsApp au numéro connecté:

```
Salut, tu as quoi comme produits?
```

Le bot répond automatiquement!

### Exemples de conversations

**Client:**
> Bonjour, vous avez des boubous?

**Bot:**
> Oui chef! On a des beaux boubous brodés en bazin riche 🔥  
> Disponibles en blanc, bleu et noir  
> 35 000 FCFA  
> Tu veux voir les photos?

**Client:**
> Oui montre moi

**Bot:**
> Voilà! 👇  
> [Envoie automatiquement les images]  
> Tu veux commander? On livre partout à Dakar en 24h 👍

---

## 🔥 Détection Clients Chauds

Quand un client dit:
- "Je veux commander"
- "C'est combien la livraison?"
- "Je prends 2"
- Etc.

Le bot détecte automatiquement et:
1. Affiche dans la console: `🔥 CLIENT CHAUD DÉTECTÉ!`
2. Envoie une notification WhatsApp à l'admin

---

## 📊 Excel → JSON (Ajouter des produits facilement)

### Méthode 1: Script automatique

Créer un fichier Excel `produits.xlsx`:

| id   | nom              | prix  | devise | description           | images                    | video                    | categorie |
|------|------------------|-------|--------|-----------------------|---------------------------|--------------------------|-----------|
| P001 | Boubou brodé     | 35000 | FCFA   | Boubou en bazin riche | https://example.com/1.jpg | https://example.com/v.mp4| Homme     |
| P002 | Robe ankara      | 22000 | FCFA   | Robe moderne          | https://example.com/2.jpg |                          | Femme     |

Puis:

```bash
npm run excel-to-json
```

Le fichier `business.json` est mis à jour automatiquement!

### Méthode 2: Convertisseur en ligne

1. Aller sur https://www.convertcsv.com/csv-to-json.htm
2. Exporter votre Excel en CSV
3. Coller le CSV
4. Convertir en JSON
5. Copier dans `business.json`

---

## 📁 Structure du Projet

```
whatsapp-bot/
├── bot.js              # Fichier principal (Baileys + logique)
├── ai.js               # Intégration Google AI (Gemini)
├── business.json       # Vos produits et infos business
├── package.json        # Dépendances
├── .env                # Configuration (à créer)
├── .env.example        # Exemple de configuration
├── excel-to-json.js    # Script conversion Excel
├── README.md           # Ce fichier
└── auth_info_baileys/  # Session WhatsApp (créé auto)
```

---

## 🛠️ Maintenance

### Voir les logs

```bash
pm2 logs whatsapp-bot
```

### Redémarrer le bot

```bash
pm2 restart whatsapp-bot
```

### Mettre à jour les produits

1. Modifier `business.json`
2. Redémarrer: `pm2 restart whatsapp-bot`

### Sauvegarder la session

Le dossier `auth_info_baileys/` contient votre session WhatsApp.

**Important:** Sauvegardez ce dossier pour ne pas re-scanner le QR code!

```bash
# Sauvegarder
tar -czf session-backup.tar.gz auth_info_baileys/

# Restaurer
tar -xzf session-backup.tar.gz
```

---

## ❓ Problèmes Courants

### Le QR code ne s'affiche pas

```bash
pm2 stop whatsapp-bot
node bot.js
```

Scannez le QR, puis relancez avec PM2.

### "GOOGLE_API_KEY manquant"

Vérifiez que le fichier `.env` existe et contient votre clé Google AI Studio.

### Le bot ne répond pas

1. Vérifier les logs: `pm2 logs whatsapp-bot`
2. Vérifier la connexion: le bot doit afficher "✅ Bot WhatsApp connecté"
3. Vérifier le quota Google AI Studio (normalement très généreux)

### Images/vidéos ne s'envoient pas

Les URLs dans `business.json` doivent être:
- Publiques (pas de lien Google Drive privé)
- Directes (finir par .jpg, .mp4, etc.)
- Accessibles sans authentification

**Astuce:** Utilisez Imgur, Cloudinary, ou votre propre serveur.

### Session expirée

Si WhatsApp vous déconnecte:
1. Supprimer `auth_info_baileys/`
2. Relancer le bot
3. Re-scanner le QR code

---

## 💡 Conseils

### Optimiser les réponses IA

Modifier le prompt dans `ai.js` (fonction `buildSystemPrompt()`):
- Ajuster le ton
- Ajouter des règles spécifiques
- Personnaliser le style

### Google AI Studio - Gratuit!

- ✅ Gemini 1.5 Flash est **gratuit**
- ✅ Quota généreux (15 requêtes/minute)
- ✅ Pas de carte bancaire nécessaire
- Monitorer l'usage sur https://aistudio.google.com

### Améliorer la détection produits

Dans `ai.js`, fonction `detectProductMention()`:
- Ajouter des mots-clés
- Améliorer la logique de détection

---

## 🔒 Sécurité

- **Ne jamais** partager votre `.env`
- **Ne jamais** commit `.env` sur Git
- Ajouter `.env` dans `.gitignore`
- Sauvegarder `auth_info_baileys/` en sécurité
- Utiliser des URLs HTTPS pour les médias

---

## 📈 Évolutions Possibles

- [ ] Ajouter paiement mobile (Wave, Orange Money)
- [ ] Système de panier
- [ ] Tracking commandes
- [ ] Multi-langues
- [ ] Statistiques de vente
- [ ] Webhook pour notifications
- [ ] Intégration CRM

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs: `pm2 logs`
2. Vérifier la configuration `.env`
3. Tester en local: `node bot.js`
4. Vérifier le crédit OpenAI

---

## 📄 Licence

MIT - Libre d'utilisation commerciale

---

## ✅ Checklist Avant Production

- [ ] `.env` configuré avec vraie clé OpenAI
- [ ] `business.json` rempli avec vos produits
- [ ] Images/vidéos accessibles en ligne
- [ ] ADMIN_NUMBER configuré
- [ ] Bot testé en local
- [ ] PM2 installé sur le serveur
- [ ] QR code scanné
- [ ] Test d'envoi/réception OK
- [ ] Sauvegarde `auth_info_baileys/` faite

---

**Prêt à vendre! 🚀🔥**
