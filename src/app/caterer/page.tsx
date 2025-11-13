'use client';
import { Clock, User, PlusCircle } from 'lucide-react';
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

export default function CatererPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCaterer, setIsCaterer] = useState(true);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();

  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);

  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'caterers', user.uid, 'menuItems');
  }, [firestore, user]);

  const {
    data: menuItems,
    isLoading: isMenuLoading,
  } = useCollection<MenuItem>(menuItemsRef);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    setIsCaterer(pathname === '/caterer');
  }, [pathname, user, isUserLoading, router]);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Settings'];

  const handleRoleChange = (checked: boolean) => {
    setIsCaterer(checked);
    if (checked) {
      router.push('/caterer');
    } else {
      router.push('/');
    }
  };

  const handleAddMenuItem = () => {
    if (!user || !menuItemsRef) return;
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid number for the price.',
      });
      return;
    }

    const newItem = {
      catererId: user.uid,
      name: newItemName,
      description: newItemDescription,
      price,
      available: true,
    };
    addDocumentNonBlocking(menuItemsRef, newItem);

    toast({ title: 'Menu item added successfully!' });
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setAddOpen(false);
  };

  const handleAvailabilityChange = (itemId: string, available: boolean) => {
    if (!user || !firestore) return;
    const itemDocRef = doc(firestore, 'caterers', user.uid, 'menuItems', itemId);
    updateDocumentNonBlocking(itemDocRef, { available });
  };

  if (!isClient || isUserLoading || isMenuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
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
                <SidebarMenuButton isActive={item === 'Menu Items'}>
                  {item}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Link href="/profile">
            <div className="flex items-center gap-2 p-2 cursor-pointer hover:bg-sidebar-accent rounded-md">
              <Avatar>
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Caterer Name</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </Link>
        </SidebarFooter>
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Menu Items</h1>
            <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Menu Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="col-span-3"
                      placeholder="Item name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="col-span-3"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price (₹)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., 50.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="submit"
                      onClick={handleAddMenuItem}
                      disabled={
                        !newItemName || !newItemDescription || !newItemPrice
                      }
                    >
                      Save Item
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {menuItems && menuItems.length > 0 ? (
              menuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`available-${item.id}`}
                          className="text-sm"
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </Label>
                        <Switch
                          id={`available-${item.id}`}
                          checked={item.available}
                          onCheckedChange={(checked) =>
                            handleAvailabilityChange(item.id, checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  You haven&apos;t added any menu items yet.
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
