'use client';
import { Clock, PlusCircle, Trash2, Edit, Check, ChevronsUpDown } from 'lucide-react';
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
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import Image from 'next/image';
import { getItemCategory } from '@/ai/flows/get-item-category-flow';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
  imageUrl?: string;
  catererId: string;
};

type ImageSource = 'upload' | 'url' | 'none';

type GroupedMenuItems = {
  [category: string]: MenuItem[];
};

export default function CatererPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname.startsWith('/caterer');
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();
  
  // A hardcoded catererId for demonstration without auth
  const catererId = 'demo-caterer';

  // Add Item State
  const [isAddOpen, setAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [addImageSource, setAddImageSource] = useState<ImageSource>('none');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  
  // Edit Item State
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editImageSource, setEditImageSource] = useState<ImageSource>('none');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'menuItems');
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: isMenuLoading } =
    useCollection<MenuItem>(menuItemsRef);

  const groupedMenuItems = useMemo(() => {
    if (!menuItems) return {};
    return menuItems.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as GroupedMenuItems);
  }, [menuItems]);
  
  const categoryOrder = useMemo(() => {
      if (!menuItems) return [];
      const order = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Main Course', 'Beverages', 'Desserts'];
      const presentCategories = new Set(menuItems.map(item => item.category));
      
      const sorted = Array.from(presentCategories).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
      return sorted;
  }, [menuItems]);


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
    router.push(checked ? '/caterer' : '/');
  };

  const resetAddFormState = useCallback(() => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setAddImageSource('none');
    setAddImageUrl('');
    setAddImageFile(null);
    setAddOpen(false);
  }, []);
  
  const resetEditFormState = useCallback(() => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemDescription('');
    setEditItemPrice('');
    setEditImageSource('none');
    setEditImageUrl('');
    setEditImageFile(null);
    setEditOpen(false);
  }, []);

  const handleAddMenuItem = async () => {
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

    let category = 'Uncategorized';
    try {
      category = await getItemCategory({
        name: newItemName,
        description: newItemDescription,
      });
    } catch (error) {
      console.error("Failed to get category from AI:", error);
      toast({
        variant: 'destructive',
        title: 'AI Categorization Failed',
        description: 'Could not determine a category. Please try again.',
      });
      return;
    }


    const saveItem = (finalImageUrl?: string) => {
      const newItemData: Omit<MenuItem, 'id'> = {
        catererId: catererId,
        name: newItemName,
        description: newItemDescription,
        price,
        available: true,
        category,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      };

      addDocumentNonBlocking(menuItemsRef, newItemData);
      toast({ title: 'Menu item added successfully!' });
      resetAddFormState();
    };
    
    if (addImageSource === 'url') {
      saveItem(addImageUrl);
    } else if (addImageSource === 'upload' && addImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveItem(reader.result as string);
      };
      reader.readAsDataURL(addImageFile);
    } else {
      saveItem();
    }
  };

  const handleEditMenuItem = async () => {
    if (!firestore || !editingItem) return;

    const price = parseFloat(editItemPrice);
    if (isNaN(price)) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid number for the price.',
      });
      return;
    }

    let category = editingItem.category;
    // Recategorize if name or description changed
    if (editItemName !== editingItem.name || editItemDescription !== editingItem.description) {
      try {
        category = await getItemCategory({
          name: editItemName,
          description: editItemDescription,
        });
      } catch (error) {
        console.error("Failed to get category from AI:", error);
        toast({
          variant: 'destructive',
          title: 'AI Categorization Failed',
          description: 'Could not update the category. Please try again.',
        });
        return;
      }
    }


    const itemDocRef = doc(firestore, 'caterers', catererId, 'menuItems', editingItem.id);

    const saveItem = (finalImageUrl?: string) => {
      const updatedData: Partial<MenuItem> = {
        name: editItemName,
        description: editItemDescription,
        price,
        category,
      };
      
      if (editImageSource !== 'none') {
        updatedData.imageUrl = finalImageUrl;
      } else if (editImageSource === 'none') {
         updatedData.imageUrl = '';
      }

      updateDocumentNonBlocking(itemDocRef, updatedData);
      toast({ title: 'Menu item updated successfully!' });
      resetEditFormState();
    };

    if (editImageSource === 'url') {
      saveItem(editImageUrl);
    } else if (editImageSource === 'upload' && editImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveItem(reader.result as string);
      };
      reader.readAsDataURL(editImageFile);
    } else {
      saveItem(editingItem.imageUrl);
    }
  };
  
  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemDescription(item.description);
    setEditItemPrice(String(item.price));
    setEditImageUrl(item.imageUrl || '');
    setEditImageSource(item.imageUrl ? 'url' : 'none');
    setEditImageFile(null);
    setEditOpen(true);
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

  const renderAddFormContent = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-name" className="text-right">
          Name
        </Label>
        <Input
          id="add-name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="col-span-3"
          placeholder="Item name"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-description" className="text-right">
          Description
        </Label>
        <Textarea
          id="add-description"
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          className="col-span-3"
          placeholder="Item description"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-price" className="text-right">
          Price (₹)
        </Label>
        <Input
          id="add-price"
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
            value={addImageSource}
            onValueChange={(value: string) =>
              setAddImageSource(value as ImageSource)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="add-r-none" />
              <Label htmlFor="add-r-none">No Photo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upload" id="add-r-upload" />
              <Label htmlFor="add-r-upload">Upload from computer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="add-r-url" />
              <Label htmlFor="add-r-url">Add image by URL</Label>
            </div>
          </RadioGroup>
          {addImageSource === 'upload' && (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setAddImageFile(
                  e.target.files ? e.target.files[0] : null
                )
              }
            />
          )}
          {addImageSource === 'url' && (
            <Input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={addImageUrl}
              onChange={(e) => setAddImageUrl(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
  
  const renderEditFormContent = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-name" className="text-right">
          Name
        </Label>
        <Input
          id="edit-name"
          value={editItemName}
          onChange={(e) => setEditItemName(e.target.value)}
          className="col-span-3"
          placeholder="Item name"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-description" className="text-right">
          Description
        </Label>
        <Textarea
          id="edit-description"
          value={editItemDescription}
          onChange={(e) => setEditItemDescription(e.target.value)}
          className="col-span-3"
          placeholder="Item description"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-price" className="text-right">
          Price (₹)
        </Label>
        <Input
          id="edit-price"
          type="number"
          value={editItemPrice}
          onChange={(e) => setEditItemPrice(e.target.value)}
          className="col-span-3"
          placeholder="e.g., 50.00"
        />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Photo</Label>
        <div className="col-span-3 space-y-4">
          <RadioGroup
            value={editImageSource}
            onValueChange={(value: string) =>
              setEditImageSource(value as ImageSource)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="edit-r-none" />
              <Label htmlFor="edit-r-none">Remove Photo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upload" id="edit-r-upload" />
              <Label htmlFor="edit-r-upload">Upload from computer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="edit-r-url" />
              <Label htmlFor="edit-r-url">Add image by URL</Label>
            </div>
          </RadioGroup>
          {editImageSource === 'upload' && (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setEditImageFile(
                  e.target.files ? e.target.files[0] : null
                )
              }
            />
          )}
          {editImageSource === 'url' && (
            <Input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );

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
                <Link href={item === 'Menu Items' ? '/caterer' : `/caterer/${item.toLowerCase().replace(' ', '-')}`} className="w-full">
                  <SidebarMenuButton isActive={item === 'Menu Items'}>
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Menu Items</h1>
            <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) resetAddFormState(); }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              {isAddOpen && (
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  {renderAddFormContent()}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetAddFormState}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleAddMenuItem}
                      disabled={
                        !newItemName ||
                        !newItemDescription ||
                        !newItemPrice
                      }
                    >
                      Save Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>
          </div>

          {/* Edit Dialog */}
           <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) resetEditFormState(); }}>
              {isEditOpen && (
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Menu Item</DialogTitle>
                  </DialogHeader>
                  {renderEditFormContent()}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetEditFormState}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleEditMenuItem}
                      disabled={
                        !editItemName ||
                        !editItemDescription ||
                        !editItemPrice
                      }
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>

          <div className="grid gap-4">
             {menuItems && menuItems.length > 0 ? (
              categoryOrder.map((category) => (
                <div key={category}>
                  <h2 className="text-xl font-bold my-4">{category}</h2>
                  <div className="grid gap-4">
                    {groupedMenuItems[category]?.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-md object-cover"
                            />
                          )}
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
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
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
