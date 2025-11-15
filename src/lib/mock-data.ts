
type SalesData = {
  name: string;
  revenue: number;
};

export const salesData: SalesData[] = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

type PopularItem = {
  name: string;
  orders: number;
};

export const popularItemsData: PopularItem[] = [
  { name: 'Biryani', orders: 400 },
  { name: 'Paratha', orders: 300 },
  { name: 'Pizza', orders: 300 },
  { name: 'Rolls', orders: 200 },
  { name: 'Noodles', orders: 278 },
];

type RecentOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'Pending' | 'Processing' | 'Delivered';
  date: string;
}

export const recentOrders: RecentOrder[] = [
  { id: '1', customerName: 'Liam Johnson', customerEmail: 'liam@example.com', amount: 250.00, status: 'Delivered', date: '2023-06-23' },
  { id: '2', customerName: 'Olivia Smith', customerEmail: 'olivia@example.com', amount: 150.75, status: 'Pending', date: '2023-06-24' },
  { id: '3', customerName: 'Noah Williams', customerEmail: 'noah@example.com', amount: 350.00, status: 'Processing', date: '2023-06-24' },
  { id: '4', customerName: 'Emma Brown', customerEmail: 'emma@example.com', amount: 450.50, status: 'Delivered', date: '2023-06-25' },
  { id: '5', customerName: 'Ava Jones', customerEmail: 'ava@example.com', amount: 550.00, status: 'Delivered', date: '2023-06-26' },
];
