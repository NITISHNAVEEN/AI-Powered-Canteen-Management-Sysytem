'use client';
import { Clock, Check, X, Truck, Hash, Trash2 } from 'lucide-react';
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
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

type Order = {
    id: string;
    userId: string;
    catererId: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
    orderDate: {
        seconds: number;
        nanoseconds: number;
    };
    tokenNumber: number;
    customerName?: string;
    customerEmail?: string;
};

const statusIcons = {
    Pending: <Clock className="h-4 w-4" />,
    Processing: <Truck className="h-4 w-4" />,
    Delivered: <Check className="h-4 w-4" />,
    Cancelled: <X className="h-4 w-4" />,
};

const statusColors = {
    Pending: 'bg-yellow-400 text-yellow-900',
    Processing: 'bg-blue-400 text-blue-900',
    Delivered: 'bg-green-500 text-white',
    Cancelled: 'bg-red-500 text-white',
};

export default function OrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState('');
  const catererId = 'demo-caterer';
  const { toast } = useToast();

  const ordersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'orders');
  }, [firestore, catererId]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<Order>(ordersRef);
  
  const sortedOrders = useMemo(() => {
      if (!orders) return [];
      return [...orders].sort((a, b) => b.orderDate.seconds - a.orderDate.seconds);
  }, [orders]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories'];

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    if (!firestore) return;
    
    const catererOrderDocRef = doc(firestore, 'caterers', catererId, 'orders', order.id);
    updateDocumentNonBlocking(catererOrderDocRef, { status: newStatus });

    if (order.userId) {
        const userOrderDocRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        setDoc(userOrderDocRef, { status: newStatus }, { merge: true });
    }

    toast({ title: 'Order status updated!' });
  };
  
  const handleDeleteOrder = (order: Order) => {
    if (!firestore) return;
    
    // Delete from caterer's collection
    const catererOrderDocRef = doc(firestore, 'caterers', catererId, 'orders', order.id);
    deleteDocumentNonBlocking(catererOrderDocRef);

    // Delete from user's collection
    if (order.userId) {
        const userOrderDocRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        deleteDocumentNonBlocking(userOrderDocRef);
    }
    
    toast({
        title: 'Order Deleted',
        description: `Order #${order.tokenNumber} has been removed.`,
    });
  };

  if (areOrdersLoading) {
      return <div className="flex h-screen items-center justify-center">Loading Orders...</div>;
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
                  <SidebarMenuButton isActive={item === 'Orders'}>
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
            <Button asChild variant="outline">
                <Link href="/">View User Site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto bg-muted/40">
           <Card>
            <CardHeader>
                <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedOrders.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-bold text-lg">
                                  <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    {order.tokenNumber}
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{order.customerName || 'Anonymous User'}</div>
                                    <div className="text-sm text-muted-foreground">{order.customerEmail || 'N/A'}</div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(order.orderDate.seconds * 1000), 'PPpp')}
                                </TableCell>
                                <TableCell>
                                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                </TableCell>
                                <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Select
                                        value={order.status}
                                        onValueChange={(newStatus) => handleStatusChange(order, newStatus as Order['status'])}
                                    >
                                        <SelectTrigger className={`w-[140px] ${statusColors[order.status]}`}>
                                            <div className="flex items-center gap-2">
                                                {statusIcons[order.status]}
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(['Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(status => (
                                                <SelectItem key={status} value={status}>
                                                     <div className="flex items-center gap-2">
                                                        {statusIcons[status]}
                                                        {status}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        disabled={order.status !== 'Delivered' && order.status !== 'Cancelled'}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the order history for token #{order.tokenNumber}. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteOrder(order)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                     <div className="py-12 text-center text-muted-foreground">No orders have been placed yet.</div>
                )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
