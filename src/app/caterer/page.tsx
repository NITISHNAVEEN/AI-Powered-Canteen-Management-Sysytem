'use client';
import { Clock, PlusCircle, Trash2, Edit, Check, X, Undo, Search } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type FoodType = 'veg' | 'non-veg';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
  imageUrl?: string;
  catererId: string;
  foodType: FoodType;
  averageRating?: number;
  numberOfRatings?: number;
};

type Category = {
    id: string;
    name: string;
}

type ImageSource = 'upload' | 'url' | 'none';

type GroupedMenuItems = {
  [category: string]: MenuItem[];
};

type AvailabilityState = {
    id: string;
    available: boolean;
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


export default function CatererPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();
  
  const catererId = 'demo-caterer';
  const [searchQuery, setSearchQuery] = useState('');

  // Add Item State
  const [isAddOpen, setAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemFoodType, setNewItemFoodType] = useState<FoodType>('veg');
  const [addImageSource, setAddImageSource] = useState<ImageSource>('none');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  
  // Edit Item State
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemFoodType, setEditItemFoodType] = useState<FoodType>('veg');
  const [editImageSource, setEditImageSource] = useState<ImageSource>('none');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Bulk update state
  const [previousAvailabilityState, setPreviousAvailabilityState] = useState<AvailabilityState[] | null>(null);


  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'menuItems');
  }, [firestore, catererId]);

  const categoriesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'categories');
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: isMenuLoading } =
    useCollection<MenuItem>(menuItemsRef);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  const groupedMenuItems = useMemo(() => {
    if (!filteredMenuItems) return {};
    return filteredMenuItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as GroupedMenuItems);
  }, [filteredMenuItems]);
  
  const categoryOrder = useMemo(() => {
      if (!filteredMenuItems) return [];
      
      const definedCategoryNames = categories ? categories.map(c => c.name).sort() : [];
      
      const allCategoriesInMenu = [...new Set(filteredMenuItems.map(item => item.category || 'Uncategorized'))];
      
      const orderedCategories = definedCategoryNames.filter(c => allCategoriesInMenu.includes(c));
      
      const uncategorizedItemsExist = allCategoriesInMenu.includes('Uncategorized');
      
      // Add any menu item categories that are not in the defined categories list, except for 'Uncategorized'
      allCategoriesInMenu.forEach(c => {
          if (!orderedCategories.includes(c) && c !== 'Uncategorized') {
              orderedCategories.push(c);
          }
      });

      if (uncategorizedItemsExist) {
          orderedCategories.push('Uncategorized');
      }
      
      return orderedCategories;
  }, [categories, filteredMenuItems]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories', 'Reviews'];

  const resetAddFormState = useCallback(() => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setNewItemCategory('');
    setNewItemFoodType('veg');
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
    setEditItemCategory('');
    setEditItemFoodType('veg');
    setEditImageSource('none');
    setEditImageUrl('');
    setEditImageFile(null);
    setEditOpen(false);
  }, []);

  const handleMarkAllUnavailable = async () => {
    if (!firestore || !menuItems) return;

    // Save current state
    const currentState = menuItems.map(item => ({ id: item.id, available: item.available }));
    setPreviousAvailabilityState(currentState);

    const batch = writeBatch(firestore);
    menuItems.forEach(item => {
        if(item.available) {
            const itemRef = doc(firestore, 'caterers', catererId, 'menuItems', item.id);
            batch.update(itemRef, { available: false });
        }
    });

    try {
      await batch.commit();
      toast({
        title: 'All Items Unavailable',
        description: 'All menu items have been marked as unavailable.',
      });
    } catch (error) {
      console.error('Bulk update to unavailable failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not mark all items as unavailable. Please try again.',
      });
      setPreviousAvailabilityState(null); // Clear state if failed
    }
  };
  
  const handleRevertAvailability = async () => {
    if (!firestore || !previousAvailabilityState) return;

    const batch = writeBatch(firestore);
    previousAvailabilityState.forEach(itemState => {
      const itemRef = doc(firestore, 'caterers', catererId, 'menuItems', itemState.id);
      batch.update(itemRef, { available: itemState.available });
    });

    try {
      await batch.commit();
      toast({
        title: 'Availability Reverted',
        description: 'Menu items have been restored to their previous state.',
      });
    } catch (error) {
      console.error('Bulk revert failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not revert item availability. Please try again.',
      });
    } finally {
      setPreviousAvailabilityState(null); // Clear state after attempt
    }
  };


  const handleAddMenuItem = async () => {
    if (!menuItemsRef || !newItemCategory) return;
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
      const newItemData = {
        name: newItemName,
        description: newItemDescription,
        price,
        available: true,
        category: newItemCategory,
        foodType: newItemFoodType,
        catererId,
        averageRating: 0,
        numberOfRatings: 0,
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
    if (!firestore || !editingItem || !editItemCategory) return;

    const price = parseFloat(editItemPrice);
    if (isNaN(price)) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid number for the price.',
      });
      return;
    }

    const itemDocRef = doc(firestore, 'caterers', catererId, 'menuItems', editingItem.id);

    const saveItem = (finalImageUrl?: string) => {
      const updatedData: Partial<MenuItem> = {
        name: editItemName,
        description: editItemDescription,
        price,
        category: editItemCategory,
        foodType: editItemFoodType,
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
    setEditItemCategory(item.category);
    setEditItemFoodType(item.foodType || 'veg');
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
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-category" className="text-right">
          Category
        </Label>
        <Select onValueChange={setNewItemCategory} value={newItemCategory}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
                {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                        {category.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Type</Label>
        <RadioGroup
            value={newItemFoodType}
            onValueChange={(value) => setNewItemFoodType(value as FoodType)}
            className="col-span-3 flex gap-4"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="veg" id="add-type-veg" />
                <Label htmlFor="add-type-veg">Veg</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-veg" id="add-type-nonveg" />
                <Label htmlFor="add-type-nonveg">Non-Veg</Label>
            </div>
        </RadioGroup>
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
        <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-category" className="text-right">
          Category
        </Label>
        <Select onValueChange={setEditItemCategory} value={editItemCategory}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
                {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                        {category.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Type</Label>
        <RadioGroup
            value={editItemFoodType}
            onValueChange={(value) => setEditItemFoodType(value as FoodType)}
            className="col-span-3 flex gap-4"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="veg" id="edit-type-veg" />
                <Label htmlFor="edit-type-veg">Veg</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-veg" id="edit-type-nonveg" />
                <Label htmlFor="edit-type-nonveg">Non-Veg</Label>
            </div>
        </RadioGroup>
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

  if (isMenuLoading || areCategoriesLoading) {
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
              <h2 className="text-lg font-semibold">Caterer Admin</h2>
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
            <div className="flex items-center gap-2 p-2 border rounded-md bg-white">
              <Clock className="w-5 h-5" />
              <span>{currentTime} IST</span>
            </div>
            <Button asChild variant="outline" style={{ backgroundColor: '#D7F5E1', color: 'black' }}>
                <Link href="/">View User Site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Menu Items</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search menu..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
                          !newItemPrice ||
                          !newItemCategory
                        }
                      >
                        Save Item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                )}
              </Dialog>
            </div>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Open/Close canteen</h3>
                    <p className="text-sm text-muted-foreground">Control opening and closing of your canteen in real-time</p>
                </div>
                <div className="flex gap-2">
                    {previousAvailabilityState ? (
                        <Button
                          onClick={handleRevertAvailability}
                          style={{ backgroundColor: '#5EDC1F', color: 'white' }}
                        >
                            <Undo className="mr-2 h-4 w-4" /> Open Canteen
                        </Button>
                    ) : (
                        <Button onClick={handleMarkAllUnavailable} variant="destructive">
                            <X className="mr-2 h-4 w-4" /> Close Canteen
                        </Button>
                    )}
                </div>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
           <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) resetEditFormState(); }}>
              {isEditOpen && editingItem && (
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
                        !editItemPrice ||
                        !editItemCategory
                      }
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>

          <div className="grid gap-4">
             {filteredMenuItems && filteredMenuItems.length > 0 ? (
              categoryOrder.map((category) => (
                groupedMenuItems[category] && (
                <div key={category}>
                  <h2 className="text-xl font-bold my-4">{category}</h2>
                  <div className="grid gap-4">
                    {groupedMenuItems[category].map((item) => (
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
                )
              ))
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  {searchQuery ? `No menu items found for "${searchQuery}".` : "You haven't added any menu items yet."}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    

    

    
