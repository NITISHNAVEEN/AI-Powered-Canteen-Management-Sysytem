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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { salesData, popularItemsData, recentOrders } from '@/lib/mock-data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCaterer = pathname.startsWith('/caterer');
  const [currentTime, setCurrentTime] = useState('');

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

  const totalRevenue = salesData.reduce((acc, item) => acc + item.revenue, 0);
  const totalOrders = recentOrders.length;
  const mostPopularItem = popularItemsData.reduce((prev, current) => (prev.orders > current.orders) ? prev : current);

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

        <main className="flex-1 p-4 overflow-y-auto bg-muted/40">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Based on all-time orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{totalOrders}</div>
                 <p className="text-xs text-muted-foreground">Total orders placed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Popular Item</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mostPopularItem.name}</div>
                <p className="text-xs text-muted-foreground">with {mostPopularItem.orders} orders</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-4">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
             <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                        </TableCell>
                         <TableCell>
                          <Badge 
                            variant={order.status === 'Delivered' ? 'default' : order.status === 'Pending' ? 'secondary' : 'outline'}
                            className={order.status === 'Delivered' ? 'bg-green-500 text-white' : ''}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className="text-right">₹{order.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
