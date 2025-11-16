'use client';
import { Clock, ShoppingCart, History, Search, Filter } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getRecommendedItems, RecommendedItemsOutput } from '@/ai/flows/get-recommended-items-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useFilters } from '@/hooks/use-filters';


type FoodType = 'veg' | 'non-veg';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  catererId: string;
  imageUrl?: string;
  category: string;
  foodType: FoodType;
};

type Category = {
    id: string;
    name: string;
}

type Order = {
    id: string;
    userId: string;
    status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
    orderDate: { seconds: number; nanoseconds: number };
    totalAmount: number;
    tokenNumber?: number;
};

type StoredOrder = {
    orderId: string;
    userId: string;
};


type CategorizedItem = MenuItem & { image: string; imageHint: string };

type GroupedItems = {
  [category: string]: CategorizedItem[];
};

const FoodTypeIndicator = ({ type }: { type: FoodType }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'w-4 h-4 border rounded-sm flex items-center justify-center',
          type === 'veg' ? 'border-green-600' : 'border-red-600'
        )}
      >
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            type === 'veg' ? 'bg-green-600' : 'bg-red-600'
          )}
        />
      </div>
    </div>
  );
};


function PastOrder({ storedOrder }: { storedOrder: StoredOrder }) {
  const firestore = useFirestore();
  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'users', storedOrder.userId, 'orders', storedOrder.orderId);
  }, [firestore, storedOrder]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);

  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (!order) {
    return null;
  }

  return (
    <Link href={`/order/status?orderId=${order.id}&userId=${storedOrder.userId}`} className="block">
      <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
        <div>
          <p className="font-semibold">Order #{order.tokenNumber || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">Status: {order.status}</p>
        </div>
        <p className="text-sm font-semibold">₹{order.totalAmount.toFixed(2)}</p>
      </div>
    </Link>
  );
}


export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { addToCart, cartItems } = useCart();
  const [pastOrders, setPastOrders] = useState<StoredOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { filters, isFiltersLoading } = useFilters();


  const [recommendations, setRecommendations] = useState<RecommendedItemsOutput | null>(null);
  const [areRecommendationsLoading, setAreRecommendationsLoading] = useState(true);
  const [recommendationsFetched, setRecommendationsFetched] = useState(false);

  // Hardcoded catererId for demonstration
  const catererId = 'demo-caterer';

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'menuItems');
  }, [firestore, catererId]);

  const categoriesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'caterers', catererId, 'categories');
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const availableMenuItems = useMemo(() => {
    let items = menuItems?.filter(item => item.available) ?? [];
    
    if (filters) {
        if (filters.foodType !== 'all') {
            items = items.filter(item => item.foodType === filters.foodType);
        }
        items = items.filter(item => item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]);
    }
    
    if (searchQuery) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    return items;
  }, [menuItems, searchQuery, filters]);

  const isCanteenOpen = (menuItems?.filter(item => item.available) ?? []).length > 0;

  const groupedItems = useMemo((): GroupedItems => {
    if (!availableMenuItems) {
      return {};
    }

    return availableMenuItems.reduce((acc, item) => {
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

  }, [availableMenuItems]);
  
  const categoriesInOrder = useMemo(() => {
    const allAvailableMenuItems = menuItems?.filter(item => item.available) ?? [];
    if (!allAvailableMenuItems || !categoriesData) return [];
    
    const definedCategoryNames = categoriesData.map(c => c.name).sort();
    
    const allCategoriesInMenu = [...new Set(allAvailableMenuItems.map(item => item.category || 'Uncategorized'))];
    
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
    const allAvailableItems = menuItems?.filter(item => item.available) ?? [];
    if (!recommendations || !allAvailableItems) return [];
    return allAvailableItems.filter(item => recommendations.recommendedItemIds.includes(item.id));
  }, [recommendations, menuItems]);


  useEffect(() => {
    const timer = setInterval(() => {
      const timeString = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      setCurrentTime(timeString);
    }, 1000);

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pastOrders');
        if (stored) {
            setPastOrders(JSON.parse(stored));
        }
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allAvailableItems = menuItems?.filter(item => item.available) ?? [];
    if (isCanteenOpen && allAvailableItems.length > 0 && !recommendationsFetched) {
      const fetchRecommendations = async () => {
        setAreRecommendationsLoading(true);
        try {
          const aiRecommendations = await getRecommendedItems({
            currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
            menuItems: allAvailableItems.map(({ id, name, description }) => ({ id, name, description })),
          });
          setRecommendations(aiRecommendations);
          setRecommendationsFetched(true); // Mark as fetched
        } catch (error) {
          console.error("Failed to get AI recommendations:", error);
          setRecommendations(null); // Clear recommendations on error
        } finally {
          setAreRecommendationsLoading(false);
        }
      };
      fetchRecommendations();
    } else if (!isMenuLoading && !recommendationsFetched) {
      // If there are no menu items, or already fetched, don't show loading state
      setAreRecommendationsLoading(false);
    }
  }, [menuItems, isMenuLoading, recommendationsFetched, isCanteenOpen]);


  const handleCategoryClick = (categoryValue: string) => {
    sectionRefs.current[categoryValue]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
  
  if (isMenuLoading || areCategoriesLoading || isFiltersLoading) {
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
              <h2 className="text-lg font-semibold">Canteen Menu</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
           {pastOrders.length > 0 && (
                <Card className="m-2" style={{ backgroundColor: '#F5DCD7' }}>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Your Past Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
                        {pastOrders.map(order => <PastOrder key={order.orderId} storedOrder={order} />)}
                    </CardContent>
                </Card>
            )}
            <Separator className={pastOrders.length > 0 ? 'my-2' : ''}/>
          <SidebarMenu>
            {isCanteenOpen && categoriesInOrder.map((cat) => (
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
          <div className="flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for dishes..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 border rounded-md bg-white">
              <Clock className="w-5 h-5" />
              <span>{currentTime} IST</span>
            </div>
            <Button asChild variant="outline" style={{ backgroundColor: '#D7F5E1', color: 'black' }}>
                <Link href="/caterer">View Caterer Site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          {!isCanteenOpen ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-2">Canteen is currently closed.</h2>
                <p className="text-muted-foreground">Please check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Recommendations Section */}
              {!searchQuery && areRecommendationsLoading && (
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

              {!searchQuery && !areRecommendationsLoading && recommendedItems.length > 0 && recommendations && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Recommended for you</h2>
                  <p className="text-muted-foreground mb-4">{recommendations.recommendationReason}</p>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedItems.map((item) => {
                       const allGroupedItems = (Object.values(groupedItems).flat());
                       const categorizedItem = allGroupedItems.find(gi => gi.id === item.id);
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
                               <div className="flex items-center gap-2">
                                <FoodTypeIndicator type={item.foodType} />
                                <h3 className="text-lg font-bold">{item.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                              <Button onClick={() => addToCart(item)} disabled={!item.available}>Add</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}


              {Object.keys(groupedItems).length > 0 ? (
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
                                    <div className="flex items-center gap-2">
                                        <FoodTypeIndicator type={item.foodType} />
                                        <h3 className="text-lg font-bold">{item.name}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                    <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                                    <Button onClick={() => addToCart(item)} disabled={!item.available}>
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
                  <CardContent className="p-12 text-center">
                    <h2 className="text-2xl font-bold mb-2">No results found</h2>
                     <p className="text-muted-foreground">
                        {searchQuery ? `Your search for "${searchQuery}" did not match any available dishes.` : "No dishes match your current filter settings."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
        
        {isCanteenOpen && (
          <footer className="sticky bottom-0 flex items-center justify-between p-4 bg-background border-t">
            <Button variant="outline" asChild>
              <Link href="/filters" className="flex items-center gap-2">
                <Filter className="h-4 w-4"/>
                Filters
              </Link>
            </Button>
            <Button asChild>
              <Link href="/checkout" className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5"/>
                <span>Checkout</span>
                {cartItems.length > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </Badge>
                )}
              </Link>
            </Button>
          </footer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
