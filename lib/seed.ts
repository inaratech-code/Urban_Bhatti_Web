import dotenv from 'dotenv';
const localResult = dotenv.config({ path: '.env.local' });
if (localResult.error) {
  dotenv.config();
}

import { getAdminDb } from './firebaseAdmin';

async function seed() {
  const adminDb = await getAdminDb();
  const sampleMenu = [
    { title: 'Veg Steam MoMo', description: 'Fluffy steamed vegetarian momo with house chutney.', price: 180, category: 'MoMo' },
    { title: 'Veg Fried MoMo', description: 'Crisp fried momo filled with seasoned vegetables.', price: 210, category: 'MoMo' },
    { title: 'Veg Kothey MoMo', description: 'Half-steamed, half-pan-seared vegetarian kothey momo.', price: 190, category: 'MoMo' },
    { title: 'Veg Chilly MoMo', description: 'Stir-fried vegetarian momo tossed in spicy sauce.', price: 230, category: 'MoMo' },
    { title: 'Veg Chiso Jhol MoMo', description: 'Cold broth momo with tangy, refreshing jhol.', price: 190, category: 'MoMo' },
    { title: 'Veg Tato Jhol MoMo', description: 'Warm, comforting broth poured over veggie momo.', price: 220, category: 'MoMo' },
    { title: 'Chicken Steam MoMo', description: 'Juicy chicken momo steamed to perfection.', price: 200, category: 'MoMo' },
    { title: 'Chicken Fried MoMo', description: 'Golden fried chicken momo for an extra crunch.', price: 230, category: 'MoMo' },
    { title: 'Chicken Kothey MoMo', description: 'Pan-seared kothey momo packed with chicken.', price: 210, category: 'MoMo' },
    { title: 'Chicken Chilly MoMo', description: 'Chicken momo tossed with peppers and chilli sauce.', price: 250, category: 'MoMo' },
    { title: 'Chicken Chiso Jhol MoMo', description: 'Chilled spicy broth poured over chicken momo.', price: 210, category: 'MoMo' },
    { title: 'Chicken Tato Jhol MoMo', description: 'Hot savoury broth poured over chicken momo.', price: 240, category: 'MoMo' },
    { title: 'Mustang Alu', description: 'Spiced potato cubes inspired by Mustang flavours.', price: 295, category: 'Veg Snacks' },
    { title: 'Wai Wai Sadeko', description: 'Crispy Wai Wai noodles tossed with fresh herbs.', price: 155, category: 'Veg Snacks' },
    { title: 'Peanut Sadeko', description: 'Roasted peanuts mixed with chilli, lime and spices.', price: 185, category: 'Veg Snacks' },
    { title: 'Bhatmas Sadeko', description: 'Crunchy soybeans tossed with chilli and garlic.', price: 165, category: 'Veg Snacks' },
    { title: 'Paneer Pakoda', description: 'Golden fried paneer fritters with house chutney.', price: 325, category: 'Veg Snacks' },
    { title: 'Veg Saute', description: 'Seasonal vegetables sautéed with garlic and chilli.', price: 215, category: 'Veg Snacks' },
    { title: 'Mushroom Chilly', description: 'Button mushrooms tossed in spicy Indo-Nepali sauce.', price: 275, category: 'Veg Snacks' },
    { title: 'Corn Salt & Pepper', description: 'Crispy sweet corn seasoned with salt and pepper.', price: 255, category: 'Veg Snacks' },
    { title: 'French Fries', description: 'Classic fries with Urban Bhatti seasoning.', price: 195, category: 'Veg Snacks' },
    { title: 'Masala Fries', description: 'Fries dusted with our signature masala mix.', price: 215, category: 'Veg Snacks' },
    { title: 'Chicken Chilly', description: 'Chicken strips tossed with peppers and chilli sauce.', price: 355, category: 'Non Veg Snacks' },
    { title: 'Chicken Hot Wings', description: 'House hot-sauce glazed crispy chicken wings.', price: 395, category: 'Non Veg Snacks' },
    { title: 'Chicken Buffalo Wings', description: 'Buffalo-style wings served with creamy dip.', price: 395, category: 'Non Veg Snacks' },
    { title: 'Chicken Lollipop', description: 'Crisp fried lollipop wings with tangy sauce.', price: 345, category: 'Non Veg Snacks' },
    { title: 'Chicken Sadeko', description: 'Smoky chicken salad with chilli and lime.', price: 365, category: 'Non Veg Snacks' },
    { title: 'Chicken Sausage', description: 'Grilled chicken sausages served with mustard.', price: 265, category: 'Non Veg Snacks' },
    { title: 'Pork Chilly', description: 'Wok-tossed pork strips with chilli and garlic.', price: 315, category: 'Non Veg Snacks' },
    { title: 'Chicken Sekuwa', description: 'Char-grilled chicken sekuwa straight from the bhatti.', price: 365, category: 'Poleko' },
    { title: 'Pork Sekuwa', description: 'Smoky pork sekuwa marinated in house spices.', price: 295, category: 'Poleko' },
    { title: 'Poleko Wings', description: 'Signature poleko wings with fire-kissed glaze.', price: 395, category: 'Poleko' },
    { title: 'Local Chicken Poleko', description: 'Whole local chicken roasted Nepali poleko style.', price: 800, category: 'Poleko' },
    { title: 'Chicken Biryani', description: 'Aromatic chicken biryani finished with fried onions.', price: 425, category: 'Biryani' }
  ];

  for (const item of sampleMenu) {
    const existing = await adminDb
      .collection('menuItems')
      .where('title', '==', item.title)
      .limit(1)
      .get();

    if (existing.empty) {
      await adminDb.collection('menuItems').add({
        ...item,
        imageUrl: categoryImages[item.category] ?? '/logo.jpg',
        rating: 4.2,
        isAvailable: true
      });
      console.log(`✅ Menu item created: ${item.title}`);
    } else {
      console.log(`ℹ️ Menu item already exists: ${item.title}`);
    }
  }

  console.log('🎉 Seed completed');
}

const categoryImages: Record<string, string> = {
  MoMo: 'https://image.pollinations.ai/prompt/Top%20view%20of%20steamed%20Nepali%20momo%20dumplings%20on%20a%20plate%2C%20food%20photography',
  'Veg Snacks': 'https://image.pollinations.ai/prompt/Crispy%20Mustang%20Alu%20with%20spices%2C%20Nepali%20vegetarian%20snack%2C%20food%20photography',
  'Non Veg Snacks': 'https://image.pollinations.ai/prompt/Assorted%20Nepali%20non-veg%20snacks%20on%20wooden%20board%2C%20appetizing%20food%20photo',
  Poleko: 'https://image.pollinations.ai/prompt/Nepali%20style%20chicken%20poleko%20wings%20on%20a%20grill%2C%20smoky%20food%20photography',
  Biryani: 'https://image.pollinations.ai/prompt/Hot%20chicken%20biryani%20served%20in%20copper%20handi%2C%20steam%20rising%2C%20food%20magazine%20shot'
};

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

