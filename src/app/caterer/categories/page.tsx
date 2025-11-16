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
import { Label } from '@/components/ui/label';

type Category = {
  id: string;
  name: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();

  const catererId = 'demo-caterer';

  const [isAddOpen, setAddOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isEditOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const categoriesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'categories');
  }, [firestore, catererId]);

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories', 'Reviews'];

  const resetAddForm = useCallback(() => {
    setNewCategoryName('');
    setAddOpen(false);
  }, []);
  
  const resetEditForm = useCallback(() => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditOpen(false);
  }, []);

  const handleAddCategory = () => {
    if (!categoriesRef || !newCategoryName.trim()) return;
    addDocumentNonBlocking(categoriesRef, { name: newCategoryName.trim() });
    toast({ title: 'Category added!' });
    resetAddForm();
  };

  const handleEditCategory = () => {
    if (!firestore || !editingCategory || !editCategoryName.trim()) return;
    const categoryDocRef = doc(firestore, 'caterers', catererId, 'categories', editingCategory.id);
    updateDocumentNonBlocking(categoryDocRef, { name: editCategoryName.trim() });
    toast({ title: 'Category updated!' });
    resetEditForm();
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!firestore) return;
    const categoryDocRef = doc(firestore, 'caterers', catererId, 'categories', categoryId);
    deleteDocumentNonBlocking(categoryDocRef);
    toast({ title: 'Category removed.' });
  };
  
  if (areCategoriesLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
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
            <div className="flex items-center gap-2 p-2 border rounded-md" style={{ backgroundColor: '#CBF7DA' }}>
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
            <h1 className="text-2xl font-bold">Categories</h1>
            <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) resetAddForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetAddForm}>Cancel</Button>
                  <Button type="submit" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Save Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={isEditOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) resetEditForm(); }}>
            {isEditOpen && (
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                    <Input id="edit-name" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetEditForm}>Cancel</Button>
                  <Button type="submit" onClick={handleEditCategory} disabled={!editCategoryName || !editCategoryName.trim()}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>

          <Card>
            <CardHeader>
                <CardTitle>Your Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 rounded-md border">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(category)}>
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
                                This will permanently delete the category. Menu items in this category will become "Uncategorized" until you re-assign them.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You haven't created any categories yet.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
