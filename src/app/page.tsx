'use client';
import { Clock } from 'lucide-react';
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
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  catererId: string;
  imageUrl?: string;
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname === '/caterer';
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'menuItems'));
  }, [firestore]);

  const { data: menuItemsData, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);

  const foodItems = useMemo(() => {
    if (!menuItemsData) return [];
    return menuItemsData.map((item, index) => {
        const placeholder = PlaceHolderImages[index % PlaceHolderImages.length];
        const imageSrc = item.imageUrl || placeholder?.imageUrl || "https://picsum.photos/seed/1/600/400";
        return {
            ...item,
            image: imageSrc,
            imageHint: placeholder?.imageHint || "food"
        }
    });
  }, [menuItemsData]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sidebarMenuItems = [
    'Recommendations',
    'Paratha',
    'Burger',
    'Rolls',
    'Biryani',
    'Quick Snacks',
    'Main Course',
  ];

  const handleRoleChange = (checked: boolean) => {
    if (checked) {
      router.push('/caterer');
    } else {
      router.push('/');
    }
  };

  if (isMenuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
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
            {sidebarMenuItems.map((item) => (
              <SidebarMenuItem key={item}>
                <SidebarMenuButton isActive={item === 'Recommendations'}>
                  {item}
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
          <div className="grid gap-4">
            {foodItems.length > 0 ? (
              foodItems.map((item) => (
                <Card key={item.id}>
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
                      <Button asChild disabled={!item.available}>
                        <Link href="/order">Order</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  No food items available at the moment.
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <footer className="sticky bottom-0 flex items-center justify-between p-4 bg-background border-t">
          <Button variant="outline" asChild>
            <Link href="/filters">Use filters</Link>
          </Button>
          <Button asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
