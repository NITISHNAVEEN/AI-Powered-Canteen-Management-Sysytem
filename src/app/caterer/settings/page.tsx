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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';


type Caterer = {
  id: string;
  username: string;
  isCanteenOpen?: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname.startsWith('/caterer');
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const catererId = 'demo-caterer';

  const catererRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'caterers', catererId);
  }, [firestore, catererId]);

  const { data: caterer, isLoading: isCatererLoading } = useDoc<Caterer>(catererRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories', 'Settings'];

  const handleRoleChange = (checked: boolean) => {
    router.push(checked ? '/caterer' : '/');
  };

  const handleCanteenStatusChange = (isOpen: boolean) => {
    if (!catererRef) return;
    updateDocumentNonBlocking(catererRef, { isCanteenOpen: isOpen });
    toast({
      title: `Canteen is now ${isOpen ? 'Open' : 'Closed'}`,
      description: isOpen ? 'Users can now place orders.' : 'Ordering has been disabled for users.',
    });
  };
  
  if (isCatererLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Settings...</div>;
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
            {menuLinks.map((item) => (
              <SidebarMenuItem key={item}>
                <Link href={item === 'Menu Items' ? '/caterer' : `/caterer/${item.toLowerCase().replace(' ', '-')}`} className="w-full">
                  <SidebarMenuButton isActive={item === 'Settings'}>
                    {item}
                  </SidebarMenuButton>
                </Link>
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
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Card>
              <CardHeader>
                <CardTitle>Canteen Status</CardTitle>
                <CardDescription>
                  Use this toggle to open or close the canteen for orders. When closed, users will not be able to place new orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {caterer?.isCanteenOpen ? 'Canteen is Open' : 'Canteen is Closed'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {caterer?.isCanteenOpen ? 'Users can browse the menu and place orders.' : 'The menu is hidden and ordering is disabled.'}
                    </p>
                  </div>
                  <Switch
                    checked={caterer?.isCanteenOpen ?? false}
                    onCheckedChange={handleCanteenStatusChange}
                    aria-label="Toggle canteen status"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
