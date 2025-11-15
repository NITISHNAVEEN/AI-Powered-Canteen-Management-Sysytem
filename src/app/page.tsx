'use client';
import { Clock, ShoppingCart } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { categorizeMenu, CategorizeMenuOutput } from '@/ai/flows/categorize-menu-flow';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  catererId: string;
  imageUrl?: string;
  category: string;
};

type CategorizedItem = MenuItem & { image: string; imageHint: string };

type AICategorizedItems = {
  [categoryKey: string]: {
    label: string;
    items: CategorizedItem[];
  };
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname === '/caterer';
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [aiCategories, setAICategories] = useState<CategorizeMenuOutput>({});
  const [isCategorizing, setIsCategorizing] = useState(true);

  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collectionGroup(firestore, 'menuItems');
  }, [firestore]);

  const { data: menuItemsData, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsRef);

  useEffect(() => {
    const categorize = async () => {
      if (!menuItemsData || menuItemsData.length === 0) {
        setAICategories({});
        setIsCategorizing(false);
        return;
      }
      setIsCategorizing(true);
      try {
        const itemsToCategorize = menuItemsData.map(({ id, name, description }) => ({
          id,
          name,
          description,
        }));
        const result = await categorizeMenu(itemsToCategorize);
        setAICategories(result);
        if (result && Object.keys(result).length > 0) {
          setActiveCategory(Object.keys(result)[0]);
        }
      } catch (error) {
        console.error("Failed to categorize menu items:", error);
        // Fallback to simple grouping if AI fails
        const fallbackCategories: CategorizeMenuOutput = {};
        menuItemsData.forEach(item => {
            const catKey = item.category || 'uncategorized';
            if (!fallbackCategories[catKey]) {
                fallbackCategories[catKey] = {
                    label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, ' '),
                    items: []
                };
            }
            fallbackCategories[catKey].items.push(item.id);
        });
        setAICategories(fallbackCategories);
      } finally {
        setIsCategorizing(false);
      }
    };
    categorize();
  }, [menuItemsData]);


  const groupedItems = useMemo((): AICategorizedItems => {
    if (!menuItemsData || Object.keys(aiCategories).length === 0) {
      return {};
    }

    const itemsById = new Map(menuItemsData.map(item => [item.id, item]));
    const result: AICategorizedItems = {};

    for (const categoryKey in aiCategories) {
      const categoryData = aiCategories[categoryKey];
      result[categoryKey] = {
        label: categoryData.label,
        items: categoryData.items
          .map(itemId => {
            const item = itemsById.get(itemId);
            if (!item) return null;

            const placeholder =
              PlaceHolderImages.find(p => p.id === (item.category || categoryKey)) ||
              PlaceHolderImages[0];
            const imageSrc = item.imageUrl || placeholder.imageUrl || 'https://picsum.photos/seed/1/600/400';

            return {
              ...item,
              image: imageSrc,
              imageHint: placeholder?.imageHint || 'food',
            };
          })
          .filter((item): item is CategorizedItem => item !== null),
      };
    }
    return result;
  }, [menuItemsData, aiCategories]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCategoryClick = (categoryValue: string) => {
    setActiveCategory(categoryValue);
    sectionRefs.current[categoryValue]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleRoleChange = (checked: boolean) => {
    if (checked) {
      router.push('/caterer');
    } else {
      router.push('/');
    }
  };
  
  const isLoading = isMenuLoading || isCategorizing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading and categorizing menu...
      </div>
    );
  }
  
  const categories = Object.keys(groupedItems).map(key => ({
      value: key,
      label: groupedItems[key].label
  }));

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">APP NAME</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {categories.map((cat) => (
              <SidebarMenuItem key={cat.value}>
                <SidebarMenuButton 
                    isActive={activeCategory === cat.value}
                    onClick={() => handleCategoryClick(cat.value)}
                >
                  {cat.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Clock className="w-5 h-5" />
              <span>{currentTime} IST</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={isCaterer ? '/caterer' : '/'}>
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full w-10 h-10 font-bold ${
                    isCaterer
                      ? 'text-red-600 border-red-600'
                      : 'text-green-600 border-green-600'
                  }`}
                >
                  {isCaterer ? 'C' : 'U'}
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Label htmlFor="role-switch">User</Label>
                <Switch
                  id="role-switch"
                  checked={isCaterer}
                  onCheckedChange={handleRoleChange}
                />
                <Label htmlFor="role-switch">Caterer</Label>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
           {Object.keys(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([categoryKey, categoryData]) => (
              <div key={categoryKey} ref={el => sectionRefs.current[categoryKey] = el} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">{categoryData.label}</h2>
                <div className="grid gap-4">
                  {categoryData.items.map((item) => (
                    <Card key={item.id} className={!item.available ? 'blur-sm pointer-events-none' : ''}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="object-cover w-24 h-24 rounded-md"
                          data-ai-hint={item.imageHint}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-bold">{item.name}</h3>
                             <span
                                className={`text-sm font-semibold ${
                                  item.available ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                ({item.available ? 'Available' : 'Unavailable'})
                              </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                          <Button disabled={!item.available}>
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                No food items available at the moment.
              </CardContent>
            </Card>
          )}
        </main>

        <footer className="sticky bottom-0 flex items-center justify-between p-4 bg-background border-t">
          <Button variant="outline" asChild>
            <Link href="/filters">Use filters</Link>
          </Button>
          <Button asChild>
            <Link href="/checkout" className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5"/>
              <span>Checkout</span>
            </Link>
          </Button>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
