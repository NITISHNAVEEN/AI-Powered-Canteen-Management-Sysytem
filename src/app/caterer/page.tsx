'use client';
import { Clock, PlusCircle, Trash2 } from 'lucide-react';
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
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

type ImageSource = 'upload' | 'url' | 'none';

export default function CatererPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname === '/caterer';
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();

  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);

  const [imageSource, setImageSource] = useState<ImageSource>('none');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // A hardcoded catererId for demonstration without auth
  const catererId = 'demo-caterer';

  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'menuItems');
  }, [firestore]);

  const { data: menuItems, isLoading: isMenuLoading } =
    useCollection<MenuItem>(menuItemsRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Settings'];

  const handleRoleChange = (checked: boolean) => {
    if (checked) {
      router.push('/caterer');
    } else {
      router.push('/');
    }
  };

  const resetAddForm = useCallback(() => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setImageSource('none');
    setImageUrl('');
    setImageFile(null);
    setAddOpen(false);
  }, []);

  const handleAddMenuItem = () => {
    if (!menuItemsRef) return;
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid number for the price.',
      });
      return;
    }

    const saveItem = (finalImageUrl?: string) => {
      const newItem: any = {
        catererId: catererId,
        name: newItemName,
        description: newItemDescription,
        price,
        available: true,
      };

      if (finalImageUrl) {
        newItem.imageUrl = finalImageUrl;
      }

      addDocumentNonBlocking(menuItemsRef, newItem);
      toast({ title: 'Menu item added successfully!' });
      resetAddForm();
    };

    if (imageSource === 'url') {
      saveItem(imageUrl);
    } else if (imageSource === 'upload' && imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveItem(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      saveItem();
    }
  };

  const handleAvailabilityChange = (itemId: string, available: boolean) => {
    if (!firestore) return;
    const itemDocRef = doc(
      firestore,
      'caterers',
      catererId,
      'menuItems',
      itemId
    );
    updateDocumentNonBlocking(itemDocRef, { available });
  };

  const handleDeleteMenuItem = (itemId: string) => {
    if (!firestore) return;
    const itemDocRef = doc(
      firestore,
      'caterers',
      catererId,
      'menuItems',
      itemId
    );
    deleteDocumentNonBlocking(itemDocRef);
    toast({ title: 'Menu item removed.' });
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
            {menuLinks.map((item) => (
              <SidebarMenuItem key={item}>
                <SidebarMenuButton isActive={item === 'Menu Items'}>
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
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Photo</Label>
                    <div className="col-span-3 space-y-4">
                      <RadioGroup
                        value={imageSource}
                        onValueChange={(value: string) =>
                          setImageSource(value as ImageSource)
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="r-none" />
                          <Label htmlFor="r-none">No Photo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="r-upload" />
                          <Label htmlFor="r-upload">Upload from computer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="url" id="r-url" />
                          <Label htmlFor="r-url">Add image by URL</Label>
                        </div>
                      </RadioGroup>
                      {imageSource === 'upload' && (
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setImageFile(
                              e.target.files ? e.target.files[0] : null
                            )
                          }
                        />
                      )}
                      {imageSource === 'url' && (
                        <Input
                          type="text"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAddForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleAddMenuItem}
                    disabled={
                      !newItemName || !newItemDescription || !newItemPrice
                    }
                  >
                    Save Item
                  </Button>
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
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the item from your menu.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
