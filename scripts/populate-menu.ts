/**
 * Script to populate Firestore menuItems collection
 * Run with: npx ts-node --transpile-only scripts/populate-menu.ts
 */

import { getAdminDb } from '../lib/firebaseAdmin';

const categoryImages: Record<string, string> = {
  MoMo: 'https://image.pollinations.ai/prompt/Top%20view%20of%20steamed%20Nepali%20momo%20dumplings%20on%20a%20plate%2C%20food%20photography',
  Poleko: 'https://image.pollinations.ai/prompt/Nepali%20style%20chicken%20poleko%20wings%20on%20a%20grill%2C%20smoky%20food%20photography',
  'Veg Snacks': 'https://image.pollinations.ai/prompt/Crispy%20Mustang%20Alu%20with%20spices%2C%20Nepali%20vegetarian%20snack%2C%20food%20photography',
  'Non Veg Snacks': 'https://image.pollinations.ai/prompt/Assorted%20Nepali%20non-veg%20snacks%20on%20wooden%20board%2C%20appetizing%20food%20photo',
  Biryani: 'https://image.pollinations.ai/prompt/Hot%20chicken%20biryani%20served%20in%20copper%20handi%2C%20steam%20rising%2C%20food%20magazine%20shot'
};

function generateDescription(title: string, category: string): string {
  const descriptions: Record<string, string> = {
    'Veg Steam MoMo': 'Fluffy steamed vegetarian momo with house chutney.',
    'Veg Fried MoMo': 'Crisp fried momo filled with seasoned vegetables.',
    'Veg Kothey MoMo': 'Half-steamed, half-pan-seared vegetarian kothey momo.',
    'Veg Chilly MoMo': 'Stir-fried vegetarian momo tossed in spicy sauce.',
    'Veg Chiso Jhol MoMo': 'Cold broth momo with tangy, refreshing jhol.',
    'Veg Tato Jhol MoMo': 'Warm, comforting broth poured over veggie momo.',
    'Chicken Steam MoMo': 'Juicy chicken momo steamed to perfection.',
    'Chicken Fried MoMo': 'Golden fried chicken momo for an extra crunch.',
    'Chicken Kothey MoMo': 'Pan-seared kothey momo packed with chicken.',
    'Chicken Chilly MoMo': 'Chicken momo tossed with peppers and chilly sauce.',
    'Chicken Chiso Jhol MoMo': 'Chilled spicy broth poured over chicken momo.',
    'Chicken Tato Jhol MoMo': 'Hot savoury broth poured over chicken momo.',
    'Mustang Alu': 'Spiced potato cubes inspired by Mustang flavours.',
    'Wai Wai Sadeko': 'Crispy Wai Wai noodles tossed with fresh herbs.',
    'Peanut Sadeko': 'Roasted peanuts mixed with chilli, lime and spices.',
    'Bhatmas Sadeko': 'Crunchy soybeans tossed with chilli and garlic.',
    'Paneer Pakoda': 'Golden fried paneer fritters with house chutney.',
    'Paneer Chilly': 'Paneer cubes tossed in spicy Indo-Nepali sauce.',
    'Veg Saute': 'Seasonal vegetables sautéed with garlic and chilli.',
    'Mushroom Chilly': 'Button mushrooms tossed in spicy Indo-Nepali sauce.',
    'Corn Salt & Pepper': 'Crispy sweet corn seasoned with salt and pepper.',
    'French Fries': 'Classic fries with Urban Bhatti seasoning.',
    'Masala Fries': 'Fries dusted with our signature masala mix.',
    'Chicken Chilly': 'Chicken strips tossed with peppers and chilli sauce.',
    'Chicken Hot Wings': 'House hot-sauce glazed crispy chicken wings.',
    'Chicken Buffalo Wings': 'Buffalo-style wings served with creamy dip.',
    'Chicken Lollipop': 'Crisp fried lollipop wings with tangy sauce.',
    'Chicken Sadeko': 'Smoky chicken salad with chilli and lime.',
    'Chicken Sausage': 'Grilled chicken sausages served with mustard.',
    'Pork Chilly': 'Wok-tossed pork strips with chilli and garlic.',
    'Chicken Sekuwa': 'Char-grilled chicken sekuwa straight from the bhatti.',
    'Pork Sekuwa': 'Smoky pork sekuwa marinated in house spices.',
    'Poleko Wings': 'Signature poleko wings with fire-kissed glaze.',
    'Local Chicken Poleko': 'Whole local chicken roasted Nepali poleko style.',
    'Chicken Biryani': 'Aromatic chicken biryani finished with fried onions.'
  };
  
  return descriptions[title] || `${title} from Urban Bhatti.`;
}

function generateRating(title: string): number {
  const base = 4.1 + ((title.length % 4) * 0.2);
  return Number(Math.min(4.9, Math.max(3.8, base)).toFixed(1));
}

const menuItems = [
  // MoMo - Veg
  { title: 'Veg Steam MoMo', price: 180, category: 'MoMo' },
  { title: 'Veg Fried MoMo', price: 210, category: 'MoMo' },
  { title: 'Veg Kothey MoMo', price: 190, category: 'MoMo' },
  { title: 'Veg Chilly MoMo', price: 230, category: 'MoMo' },
  { title: 'Veg Chiso Jhol MoMo', price: 190, category: 'MoMo' },
  { title: 'Veg Tato Jhol MoMo', price: 220, category: 'MoMo' },
  // MoMo - Chicken
  { title: 'Chicken Steam MoMo', price: 200, category: 'MoMo' },
  { title: 'Chicken Fried MoMo', price: 230, category: 'MoMo' },
  { title: 'Chicken Kothey MoMo', price: 210, category: 'MoMo' },
  { title: 'Chicken Chilly MoMo', price: 250, category: 'MoMo' },
  { title: 'Chicken Chiso Jhol MoMo', price: 210, category: 'MoMo' },
  { title: 'Chicken Tato Jhol MoMo', price: 240, category: 'MoMo' },
  // Veg Snacks
  { title: 'Mustang Alu', price: 295, category: 'Veg Snacks' },
  { title: 'Wai Wai Sadeko', price: 155, category: 'Veg Snacks' },
  { title: 'Peanut Sadeko', price: 185, category: 'Veg Snacks' },
  { title: 'Bhatmas Sadeko', price: 165, category: 'Veg Snacks' },
  { title: 'Paneer Pakoda', price: 325, category: 'Veg Snacks' },
  { title: 'Paneer Chilly', price: 375, category: 'Veg Snacks' },
  { title: 'Veg Saute', price: 215, category: 'Veg Snacks' },
  { title: 'Mushroom Chilly', price: 275, category: 'Veg Snacks' },
  { title: 'Corn Salt & Pepper', price: 255, category: 'Veg Snacks' },
  { title: 'French Fries', price: 195, category: 'Veg Snacks' },
  { title: 'Masala Fries', price: 215, category: 'Veg Snacks' },
  // Poleko
  { title: 'Chicken Sekuwa', price: 365, category: 'Poleko' },
  { title: 'Pork Sekuwa', price: 295, category: 'Poleko' },
  { title: 'Poleko Wings', price: 395, category: 'Poleko' },
  { title: 'Local Chicken Poleko', price: 800, category: 'Poleko' },
  // Biryani
  { title: 'Chicken Biryani', price: 425, category: 'Biryani' },
  // Non Veg Snacks
  { title: 'Chicken Chilly', price: 355, category: 'Non Veg Snacks' },
  { title: 'Chicken Hot Wings', price: 395, category: 'Non Veg Snacks' },
  { title: 'Chicken Buffalo Wings', price: 395, category: 'Non Veg Snacks' },
  { title: 'Chicken Lollipop', price: 345, category: 'Non Veg Snacks' },
  { title: 'Chicken Sadeko', price: 365, category: 'Non Veg Snacks' },
  { title: 'Chicken Sausage', price: 265, category: 'Non Veg Snacks' },
  { title: 'Pork Chilly', price: 315, category: 'Non Veg Snacks' }
];

async function populateMenu() {
  try {
    console.log('🚀 Starting menu population...');
    const adminDb = await getAdminDb();
    const collection = adminDb.collection('menuItems');

    // Get existing items to check for duplicates
    const existingSnapshot = await collection.get();
    const existingTitles = new Set(
      existingSnapshot.docs.map((doc) => doc.data().title?.toLowerCase().trim()).filter(Boolean)
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = adminDb.batch();
      const batchItems = menuItems.slice(i, i + batchSize);

      for (const item of batchItems) {
        const normalizedTitle = item.title.toLowerCase().trim();
        const existingDoc = existingSnapshot.docs.find(
          (doc) => doc.data().title?.toLowerCase().trim() === normalizedTitle
        );

        const imageUrl = categoryImages[item.category] || '/logo.jpg';
        const description = generateDescription(item.title, item.category);
        const rating = generateRating(item.title);

        if (existingDoc) {
          // Update existing item
          batch.update(existingDoc.ref, {
            title: item.title,
            price: item.price,
            category: item.category,
            description,
            imageUrl,
            rating,
            isAvailable: true
          });
          updated++;
        } else {
          // Create new item
          const docRef = collection.doc();
          batch.set(docRef, {
            title: item.title,
            price: item.price,
            category: item.category,
            description,
            imageUrl,
            rating,
            isAvailable: true
          });
          created++;
        }
      }

      await batch.commit();
      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1} (${batchItems.length} items)`);
    }

    console.log('\n✨ Menu population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Created: ${created} items`);
    console.log(`   - Updated: ${updated} items`);
    console.log(`   - Skipped: ${skipped} items`);
    console.log(`   - Total: ${menuItems.length} items`);
    console.log('\n🎉 Menu database is now populated!');
  } catch (error) {
    console.error('❌ Failed to populate menu:', error);
    process.exit(1);
  }
}

// Run the script
populateMenu()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

