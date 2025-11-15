'use client';
import { Clock, PlusCircle, Trash2, Edit } from 'lucide-react';
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
  DialogClose,
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
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Category = {
  id: string;
  value: string;
  label: string;
  catererId: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname.startsWith('/caterer');
  const firestore = useFirestore();
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState('');
  
  const [isAddOpen, setAddOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const [isEditOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState('');

  // A hardcoded catererId for demonstration without auth
  const catererId = 'demo-caterer';

  const categoriesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'categories');
  }, [firestore]);

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);

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

  const resetAddForm = useCallback(() => {
    setNewCategoryLabel('');
    setAddOpen(false);
  }, []);

  const resetEditForm = useCallback(() => {
    setEditingCategory(null);
    setEditCategoryLabel('');
    setEditOpen(false);
  }, []);
  
  const handleAddCategory = () => {
    if (!categoriesRef || !newCategoryLabel) return;

    const newCategoryData = {
      label: newCategoryLabel,
      value: newCategoryLabel.toLowerCase().replace(/\s+/g, '-'),
      catererId: catererId,
    };
    addDocumentNonBlocking(categoriesRef, newCategoryData);
    toast({ title: 'Category added successfully!' });
    resetAddForm();
  };
  
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryLabel(category.label);
    setEditOpen(true);
  };
  
  const handleEditCategory = () => {
    if (!firestore || !editingCategory || !editCategoryLabel) return;
    
    const categoryDocRef = doc(firestore, 'caterers', catererId, 'categories', editingCategory.id);
    const updatedData = {
      label: editCategoryLabel,
      value: editCategoryLabel.toLowerCase().replace(/\s+/g, '-'),
    };
    updateDocumentNonBlocking(categoryDocRef, updatedData);
    toast({ title: 'Category updated successfully!' });
    resetEditForm();
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!firestore) return;
    const categoryDocRef = doc(firestore, 'caterers', catererId, 'categories', categoryId);
    deleteDocumentNonBlocking(categoryDocRef);
    toast({ title: 'Category removed.' });
  };
  
  if (areCategoriesLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading categories...</div>
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
                  <SidebarMenuButton isActive={item === 'Categories'}>
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
            <h1 className="text-2xl font-bold">Categories</h1>
             <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) resetAddForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="add-name" className="text-right">
                        Label
                        </Label>
                        <Input
                        id="add-name"
                        value={newCategoryLabel}
                        onChange={(e) => setNewCategoryLabel(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Quick Snacks"
                        />
                    </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetAddForm}>Cancel</Button>
                  <Button type="submit" onClick={handleAddCategory} disabled={!newCategoryLabel}>Save Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) resetEditForm(); }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                        Label
                        </Label>
                        <Input
                        id="edit-name"
                        value={editCategoryLabel}
                        onChange={(e) => setEditCategoryLabel(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Quick Snacks"
                        />
                    </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetEditForm}>Cancel</Button>
                  <Button type="submit" onClick={handleEditCategory} disabled={!editCategoryLabel}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
                <CardTitle>Your Categories</CardTitle>
            </CardHeader>
            <CardContent>
                {categories && categories.length > 0 ? (
                    <div className="space-y-2">
                        {categories.map(category => (
                            <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span>{category.label}</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this category.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">You haven't added any categories yet.</p>
                )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
