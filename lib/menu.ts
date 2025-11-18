import { getAdminDb } from './firebaseAdmin';

export type MenuItemDto = {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: number;
  isAvailable: boolean;
};

const categoryImages: Record<string, string> = {
  MoMo: 'https://image.pollinations.ai/prompt/Top%20view%20of%20steamed%20Nepali%20momo%20dumplings%20on%20a%20plate%2C%20food%20photography',
  Poleko: 'https://image.pollinations.ai/prompt/Nepali%20style%20chicken%20poleko%20wings%20on%20a%20grill%2C%20smoky%20food%20photography',
  'Veg Snacks': 'https://image.pollinations.ai/prompt/Crispy%20Mustang%20Alu%20with%20spices%2C%20Nepali%20vegetarian%20snack%2C%20food%20photography',
  'Non Veg Snacks': 'https://image.pollinations.ai/prompt/Assorted%20Nepali%20non-veg%20snacks%20on%20wooden%20board%2C%20appetizing%20food%20photo',
  Biryani: 'https://image.pollinations.ai/prompt/Hot%20chicken%20biryani%20served%20in%20copper%20handi%2C%20steam%20rising%2C%20food%20magazine%20shot'
};

function getCategoryImage(category: string): string {
  return categoryImages[category.toLowerCase()] ?? 'https://images.unsplash.com/photo-1604908177084-dc3a6662afaf?auto=format&fit=crop&w=600&q=80';
}

function generateRating(key: string): number {
  const base = 4.1 + ((key.length % 4) * 0.2);
  return Number(Math.min(4.9, Math.max(3.8, base)).toFixed(1));
}

export async function getMenuItems(): Promise<MenuItemDto[]> {
  try {
    const adminDb = await getAdminDb();
    const snapshot = await adminDb.collection('menuItems').orderBy('title').get();
    if (snapshot.empty) {
      return getFallbackMenuItems();
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        _id: doc.id,
        title: data.title ?? 'Menu Item',
        description: data.description ?? '',
        price: data.price ?? 0,
        category: data.category ?? 'General',
        imageUrl: data.imageUrl ?? categoryImages[data.category] ?? '/logo.jpg',
        rating: data.rating ?? generateRating(data.title ?? doc.id),
        isAvailable: data.isAvailable ?? true
      };
    });
  } catch (error) {
    console.warn('Falling back to seeded menu items because Firestore is unavailable.', error);
    return getFallbackMenuItems();
  }
}

function getFallbackMenuItems(): MenuItemDto[] {
  const items: Array<{ title: string; price: number; category: string; description: string }> = [
    { title: 'Veg Steam MoMo', price: 180, category: 'MoMo', description: 'Fluffy steamed vegetarian momo with house chutney.' },
    { title: 'Veg Fried MoMo', price: 210, category: 'MoMo', description: 'Crisp fried momo filled with seasoned vegetables.' },
    { title: 'Veg Kothey MoMo', price: 190, category: 'MoMo', description: 'Half-steamed, half-pan-seared vegetarian kothey momo.' },
    { title: 'Veg Chilly MoMo', price: 230, category: 'MoMo', description: 'Stir-fried vegetarian momo tossed in spicy sauce.' },
    { title: 'Veg Chiso Jhol MoMo', price: 190, category: 'MoMo', description: 'Cold broth momo with tangy, refreshing jhol.' },
    { title: 'Veg Tato Jhol MoMo', price: 220, category: 'MoMo', description: 'Warm, comforting broth poured over veggie momo.' },
    { title: 'Chicken Steam MoMo', price: 200, category: 'MoMo', description: 'Juicy chicken momo steamed to perfection.' },
    { title: 'Chicken Fried MoMo', price: 230, category: 'MoMo', description: 'Golden fried chicken momo for an extra crunch.' },
    { title: 'Chicken Kothey MoMo', price: 210, category: 'MoMo', description: 'Pan-seared kothey momo packed with chicken.' },
    { title: 'Chicken Chilly MoMo', price: 250, category: 'MoMo', description: 'Chicken momo tossed with peppers and chilly sauce.' },
    { title: 'Chicken Chiso Jhol MoMo', price: 210, category: 'MoMo', description: 'Chilled spicy broth poured over chicken momo.' },
    { title: 'Chicken Tato Jhol MoMo', price: 240, category: 'MoMo', description: 'Hot savoury broth poured over chicken momo.' },
    { title: 'Mustang Alu', price: 295, category: 'Veg Snacks', description: 'Spiced potato cubes inspired by Mustang flavours.' },
    { title: 'Wai Wai Sadeko', price: 155, category: 'Veg Snacks', description: 'Crispy Wai Wai noodles tossed with fresh herbs.' },
    { title: 'Peanut Sadeko', price: 185, category: 'Veg Snacks', description: 'Roasted peanuts mixed with chilli, lime and spices.' },
    { title: 'Bhatmas Sadeko', price: 165, category: 'Veg Snacks', description: 'Crunchy soybeans tossed with chilli and garlic.' },
    { title: 'Paneer Pakoda', price: 325, category: 'Veg Snacks', description: 'Golden fried paneer fritters with house chutney.' },
    { title: 'Veg Saute', price: 215, category: 'Veg Snacks', description: 'Seasonal vegetables sautéed with garlic and chilli.' },
    { title: 'Mushroom Chilly', price: 275, category: 'Veg Snacks', description: 'Button mushrooms tossed in spicy Indo-Nepali sauce.' },
    { title: 'Corn Salt & Pepper', price: 255, category: 'Veg Snacks', description: 'Crispy sweet corn seasoned with salt and pepper.' },
    { title: 'French Fries', price: 195, category: 'Veg Snacks', description: 'Classic fries with Urban Bhatti seasoning.' },
    { title: 'Masala Fries', price: 215, category: 'Veg Snacks', description: 'Fries dusted with our signature masala mix.' },
    { title: 'Chicken Chilly', price: 355, category: 'Non Veg Snacks', description: 'Chicken strips tossed with peppers and chilli sauce.' },
    { title: 'Chicken Hot Wings', price: 395, category: 'Non Veg Snacks', description: 'House hot-sauce glazed crispy chicken wings.' },
    { title: 'Chicken Buffalo Wings', price: 395, category: 'Non Veg Snacks', description: 'Buffalo-style wings served with creamy dip.' },
    { title: 'Chicken Lollipop', price: 345, category: 'Non Veg Snacks', description: 'Crisp fried lollipop wings with tangy sauce.' },
    { title: 'Chicken Sadeko', price: 365, category: 'Non Veg Snacks', description: 'Smoky chicken salad with chilli and lime.' },
    { title: 'Chicken Sausage', price: 265, category: 'Non Veg Snacks', description: 'Grilled chicken sausages served with mustard.' },
    { title: 'Pork Chilly', price: 315, category: 'Non Veg Snacks', description: 'Wok-tossed pork strips with chilli and garlic.' },
    { title: 'Chicken Sekuwa', price: 365, category: 'Poleko', description: 'Char-grilled chicken sekuwa straight from the bhatti.' },
    { title: 'Pork Sekuwa', price: 295, category: 'Poleko', description: 'Smoky pork sekuwa marinated in house spices.' },
    { title: 'Poleko Wings', price: 395, category: 'Poleko', description: 'Signature poleko wings with fire-kissed glaze.' },
    { title: 'Local Chicken Poleko', price: 800, category: 'Poleko', description: 'Whole local chicken roasted Nepali poleko style.' },
    { title: 'Chicken Biryani', price: 425, category: 'Biryani', description: 'Aromatic chicken biryani finished with fried onions.' }
  ];

  return items.map((item, index) => ({
    _id: `fallback-${index + 1}`,
    title: item.title,
    description: item.description,
    price: item.price,
    category: item.category,
    imageUrl: categoryImages[item.category] ?? '/logo.jpg',
    rating: generateRating(item.title),
    isAvailable: true
  }));
}

