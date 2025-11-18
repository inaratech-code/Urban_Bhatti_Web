import { getMenuItems } from '../../lib/menu';
import MenuPageClient from '../../components/MenuPageClient';

export const dynamic = 'force-dynamic';

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  try {
    const params = await searchParams;
    const query = params?.q ?? '';
    const menuItems = await getMenuItems();

    return <MenuPageClient menuItems={menuItems} query={query} />;
  } catch (error) {
    console.error('Error loading menu page:', error);
    // Return empty menu items array to prevent page crash
    return <MenuPageClient menuItems={[]} query="" />;
  }
}
