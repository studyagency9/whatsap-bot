const XLSX = require('xlsx');
const fs = require('fs');

console.log('\n📊 CONVERSION EXCEL → JSON\n');

const excelFile = './produits.xlsx';
const businessFile = './business.json';

if (!fs.existsSync(excelFile)) {
  console.error(`❌ Fichier ${excelFile} introuvable!`);
  console.log('\n📝 Créez un fichier Excel "produits.xlsx" avec ces colonnes:');
  console.log('   - id');
  console.log('   - nom');
  console.log('   - prix');
  console.log('   - devise');
  console.log('   - description');
  console.log('   - images (URLs séparées par des virgules)');
  console.log('   - video');
  console.log('   - categorie');
  console.log('   - stock (true/false)\n');
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(excelFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ ${rawData.length} produits trouvés dans Excel\n`);

  const produits = rawData.map(row => {
    let images = [];
    if (row.images) {
      if (typeof row.images === 'string') {
        images = row.images.split(',').map(url => url.trim()).filter(url => url);
      } else {
        images = [row.images.toString()];
      }
    }

    return {
      id: row.id || `P${Math.random().toString(36).substr(2, 9)}`,
      nom: row.nom || 'Produit sans nom',
      prix: parseInt(row.prix) || 0,
      devise: row.devise || 'FCFA',
      description: row.description || '',
      stock: row.stock === true || row.stock === 'true' || row.stock === 'TRUE' || row.stock === 1,
      images: images,
      video: row.video || null,
      categorie: row.categorie || 'Général'
    };
  });

  let businessData = {};
  
  if (fs.existsSync(businessFile)) {
    const existingData = fs.readFileSync(businessFile, 'utf8');
    businessData = JSON.parse(existingData);
    console.log('📄 business.json existant chargé');
  } else {
    businessData = {
      nom_business: "Mon Business",
      description: "Description de mon business",
      telephone: "+221 XX XXX XX XX",
      horaires: "Lundi - Samedi: 9h - 20h",
      localisation: "Votre ville",
      livraison: "Livraison disponible",
      paiement: "Wave, Orange Money, Cash"
    };
    console.log('📄 Nouveau business.json créé');
  }

  businessData.produits = produits;

  if (!businessData.promotions) {
    businessData.promotions = [];
  }

  if (!businessData.faq) {
    businessData.faq = [
      {
        question: "Vous livrez où?",
        reponse: "On livre partout dans la région"
      },
      {
        question: "Comment commander?",
        reponse: "Dites-moi ce qui vous intéresse et on finalise ensemble"
      }
    ];
  }

  fs.writeFileSync(businessFile, JSON.stringify(businessData, null, 2), 'utf8');

  console.log('\n✅ CONVERSION RÉUSSIE!');
  console.log(`📦 ${produits.length} produits ajoutés dans business.json\n`);
  
  console.log('Aperçu des produits:');
  produits.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.nom} - ${p.prix.toLocaleString()} ${p.devise}`);
  });
  
  console.log('\n🚀 Vous pouvez maintenant lancer le bot: npm start\n');

} catch (error) {
  console.error('❌ Erreur lors de la conversion:', error.message);
  console.log('\n💡 Vérifiez que votre fichier Excel:');
  console.log('   - Est bien nommé "produits.xlsx"');
  console.log('   - Contient les bonnes colonnes');
  console.log('   - N\'est pas ouvert dans Excel\n');
  process.exit(1);
}
