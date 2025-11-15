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
import { collection, query, where } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

type GroupedItems = {
  [category: string]: CategorizedItem[];
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname.startsWith('/caterer');
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Hardcoded catererId for demonstration
  const catererId = 'demo-caterer';

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'caterers', catererId, 'menuItems'),
        where('available', '==', true)
    );
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);

  const groupedItems = useMemo((): GroupedItems => {
    if (!menuItems) {
      return {};
    }

    return menuItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      
      const placeholder =
        PlaceHolderImages.find(p => p.id === item.category.toLowerCase().replace(' ', '-')) ||
        PlaceHolderImages.find(p => p.id === 'main-course') ||
        PlaceHolderImages[0];
      const imageSrc = item.imageUrl || placeholder.imageUrl || 'https://picsum.photos/seed/1/600/400';

      acc[category].push({
          ...item,
          image: imageSrc,
          imageHint: placeholder?.imageHint || 'food',
      });
      return acc;
    }, {} as GroupedItems);

  }, [menuItems]);
  
  const categories = useMemo(() => {
    if (!menuItems) return [];
    const order = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Main Course', 'Beverages', 'Desserts'];
    const presentCategories = new Set(menuItems.map(item => item.category));
    
    return Array.from(presentCategories).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [menuItems]);

  useEffect(() => {
     if (categories && categories.length > 0 && !activeCategory) {
        setActiveCategory(categories[0]);
     }
  }, [categories, activeCategory]);


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
    router.push(checked ? '/caterer' : '/');
  };
  
  if (isMenuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading menu...
      </div>
    );
  }
  
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
              <SidebarMenuItem key={cat}>
                <SidebarMenuButton 
                    isActive={activeCategory === cat}
                    onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
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
           {categories && categories.length > 0 ? (
            categories.map(category => (
                groupedItems[category] && groupedItems[category].length > 0 && (
                    <div key={category} ref={el => sectionRefs.current[category] = el} className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">{category}</h2>
                        <div className="grid gap-4">
                        {groupedItems[category].map((item) => (
                            <Card key={item.id} className={!item.available ? 'opacity-50 pointer-events-none' : ''}>
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
                )
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
