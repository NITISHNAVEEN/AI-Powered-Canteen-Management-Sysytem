'use client';
import { Clock, DollarSign, Package, Users } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format } from 'date-fns';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function DashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const catererId = 'demo-caterer';

  const ordersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'orders');
  }, [firestore, catererId]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<Order>(ordersRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories'];

  const { totalRevenue, totalOrders, salesData, popularItemsData, recentOrders } = useMemo(() => {
    if (!orders) {
      return { totalRevenue: 0, totalOrders: 0, salesData: [], popularItemsData: [], recentOrders: [] };
    }

    const revenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const orderCount = orders.length;
    
    // Sales data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, 'yyyy-MM-dd');
    }).reverse();

    const dailySales = last7Days.map(dateStr => {
        const dayRevenue = orders
            .filter(order => format(new Date(order.orderDate.seconds * 1000), 'yyyy-MM-dd') === dateStr)
            .reduce((sum, order) => sum + order.totalAmount, 0);
        return { name: format(new Date(dateStr), 'EEE'), revenue: dayRevenue };
    });

    // Popular items
    const itemCounts = new Map<string, number>();
    orders.forEach(order => {
        order.items.forEach(item => {
            itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
        });
    });

    const popularItems = Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, orders: count }));

    // Recent orders
    const sortedOrders = [...orders].sort((a, b) => b.orderDate.seconds - a.orderDate.seconds).slice(0, 5);
    const recent = sortedOrders.map(order => ({
        ...order,
        date: format(new Date(order.orderDate.seconds * 1000), 'yyyy-MM-dd'),
    }));

    return { totalRevenue: revenue, totalOrders: orderCount, salesData: dailySales, popularItemsData: popularItems, recentOrders: recent };
  }, [orders]);
  
  const mostPopularItem = popularItemsData.length > 0 
      ? popularItemsData.reduce((prev, current) => (prev.orders > current.orders) ? prev : current)
      : null;
      
  if (areOrdersLoading) {
      return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>;
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
                  <SidebarMenuButton isActive={item === 'Dashboard'}>
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
            <Button asChild variant="outline">
                <Link href="/">View User Site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto bg-muted/40">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue > 0 ? totalRevenue.toFixed(2) : 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Based on all-time orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{totalOrders > 0 ? totalOrders : 'N/A'}</div>
                 <p className="text-xs text-muted-foreground">Total orders placed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Popular Item</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mostPopularItem ? mostPopularItem.name : 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                    {mostPopularItem ? `with ${mostPopularItem.orders} orders` : 'No orders yet'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-4">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {salesData.some(d => d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">No sales data for the last 7 days.</div>
                )}
              </CardContent>
            </Card>
             <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                {popularItemsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie data={popularItemsData} dataKey="orders" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                        {popularItemsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">No orders yet to determine popular items.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                {recentOrders.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-bold">#{order.tokenNumber}</TableCell>
                                <TableCell>
                                <div className="font-medium">{order.customerName || 'Anonymous'}</div>
                                <div className="text-sm text-muted-foreground">{order.customerEmail || 'N/A'}</div>
                                </TableCell>
                                <TableCell>
                                <Badge 
                                    variant={order.status === 'Delivered' ? 'default' : order.status === 'Pending' ? 'secondary' : 'outline'}
                                    className={
                                        order.status === 'Delivered' ? 'bg-green-500 text-white' : 
                                        order.status === 'Cancelled' ? 'bg-red-500 text-white' : ''
                                    }
                                >
                                    {order.status}
                                </Badge>
                                </TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                     <div className="py-12 text-center text-muted-foreground">No recent orders.</div>
                )}
            </CardContent>
          </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
