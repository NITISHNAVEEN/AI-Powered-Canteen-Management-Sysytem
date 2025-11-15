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
import { getRecommendedItems, RecommendedItemsOutput } from '@/ai/flows/get-recommended-items-flow';
import { Skeleton } from '@/components/ui/skeleton';


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

type Category = {
    id: string;
    name: string;
}

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
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [recommendations, setRecommendations] = useState<RecommendedItemsOutput | null>(null);
  const [areRecommendationsLoading, setAreRecommendationsLoading] = useState(true);

  // Hardcoded catererId for demonstration
  const catererId = 'demo-caterer';

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'caterers', catererId, 'menuItems'),
        where('available', '==', true)
    );
  }, [firestore, catererId]);

  const categoriesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'caterers', catererId, 'categories');
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

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
        PlaceHolderImages.find(p => p.id === (item.category || '').toLowerCase().replace(/[\s_]+/g, '-')) ||
        PlaceHolderImages.find(p => p.id === 'main-course') || // fallback to a generic one
        { imageUrl: 'https://picsum.photos/seed/placeholder/96/96', imageHint: 'food item' };
      const imageSrc = item.imageUrl || placeholder.imageUrl;


      acc[category].push({
          ...item,
          image: imageSrc,
          imageHint: placeholder?.imageHint || 'food',
      });
      return acc;
    }, {} as GroupedItems);

  }, [menuItems]);
  
  const categoriesInOrder = useMemo(() => {
    if (!menuItems || !categoriesData) return [];
    
    const definedCategoryNames = categoriesData.map(c => c.name).sort();
    
    const allCategoriesInMenu = [...new Set(menuItems.map(item => item.category || 'Uncategorized'))];
    
    const orderedCategories = definedCategoryNames.filter(c => allCategoriesInMenu.includes(c));
    
    const uncategorizedInMenu = allCategoriesInMenu.includes('Uncategorized');
    
    allCategoriesInMenu.forEach(c => {
        if (!orderedCategories.includes(c) && c !== 'Uncategorized') {
            orderedCategories.push(c);
        }
    });

    if (uncategorizedInMenu) {
        orderedCategories.push('Uncategorized');
    }
    
    return orderedCategories;
}, [categoriesData, menuItems]);

  const recommendedItems = useMemo(() => {
    if (!recommendations || !menuItems) return [];
    return menuItems.filter(item => recommendations.recommendedItemIds.includes(item.id));
  }, [recommendations, menuItems]);


  useEffect(() => {
    const timer = setInterval(() => {
      const timeString = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      setCurrentTime(timeString);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (menuItems && menuItems.length > 0 && currentTime) {
      const fetchRecommendations = async () => {
        setAreRecommendationsLoading(true);
        try {
          const aiRecommendations = await getRecommendedItems({
            currentTime: currentTime,
            menuItems: menuItems.map(({ id, name, description }) => ({ id, name, description })),
          });
          setRecommendations(aiRecommendations);
        } catch (error) {
          console.error("Failed to get AI recommendations:", error);
          setRecommendations(null); // Clear recommendations on error
        } finally {
          setAreRecommendationsLoading(false);
        }
      };
      fetchRecommendations();
    } else if (!isMenuLoading) {
      // If there are no menu items, don't show loading state
      setAreRecommendationsLoading(false);
    }
  }, [menuItems, currentTime, isMenuLoading]);

  const handleCategoryClick = (categoryValue: string) => {
    sectionRefs.current[categoryValue]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleRoleChange = (checked: boolean) => {
    router.push(checked ? '/caterer' : '/');
  };
  
  if (isMenuLoading || areCategoriesLoading) {
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
            {categoriesInOrder.map((cat) => (
              <SidebarMenuItem key={cat}>
                <SidebarMenuButton 
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
          {/* Recommendations Section */}
          {areRecommendationsLoading && (
            <div className="mb-8">
              <Skeleton className="h-8 w-1/3 mb-4" />
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Skeleton className="w-24 h-24 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!areRecommendationsLoading && recommendedItems.length > 0 && recommendations && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Recommended for you</h2>
              <p className="text-muted-foreground mb-4">{recommendations.recommendationReason}</p>
              <div className="grid grid-cols-1 gap-4">
                {recommendedItems.map((item) => {
                  const categorizedItem = groupedItems[item.category]?.find(gi => gi.id === item.id);
                  if (!categorizedItem) return null;
                  return (
                    <Card key={item.id} className={!item.available ? 'opacity-50 pointer-events-none' : ''}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Image
                          src={categorizedItem.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="object-cover w-24 h-24 rounded-md"
                          data-ai-hint={categorizedItem.imageHint}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                          <Button disabled={!item.available}>Add</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}


           {categoriesInOrder && categoriesInOrder.length > 0 ? (
            categoriesInOrder.map(category => (
                groupedItems[category] && groupedItems[category].length > 0 && (
                    <div 
                        key={category} 
                        ref={el => sectionRefs.current[category] = el} 
                        className="mb-8 scroll-mt-20" // scroll-mt adds top margin for scrollIntoView
                    >
                        <h2 className="text-2xl font-bold mb-4">{category}</h2>
                        <div className="grid grid-cols-1 gap-4">
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
