'use client';
import { Clock, LogOut, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function CatererPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCaterer, setIsCaterer] = useState(true);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    setIsCaterer(pathname === '/caterer');
  }, [pathname, user, isUserLoading, router]);

  const handleLogout = async () => {
    if(auth) {
      await signOut(auth);
      toast({ title: 'Logged out successfully' });
      router.push('/login');
    }
  };

  const menuItems = [
    'Dashboard',
    'Orders',
    'Menu Items',
    'Settings',
  ];

  const handleRoleChange = (checked: boolean) => {
    setIsCaterer(checked);
    if (checked) {
      router.push('/caterer');
    } else {
      router.push('/');
    }
  };

  if (isUserLoading || !user) {
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
            {menuItems.map((item) => (
              <SidebarMenuItem key={item}>
                <SidebarMenuButton isActive={item === 'Dashboard'}>
                  {item}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Caterer Name</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
               <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
               </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Clock className="w-5 h-5" />
              <span>08:00 am IST</span>
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
           <h1 className="text-4xl font-bold">Caterer Page</h1>
        </main>

        <footer className="sticky bottom-0 flex items-center justify-between p-4 bg-background border-t">
          <Button variant="outline">
            Manage Orders
          </Button>
          <Button>
            Add Menu Item
          </Button>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
