'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Edit2, Hash, Clock, Check, Truck, X } from 'lucide-react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  orderDate: {
    seconds: number;
    nanoseconds: number;
  };
  tokenNumber: number;
};

const statusIcons = {
    Pending: <Clock className="h-4 w-4" />,
    Processing: <Truck className="h-4 w-4" />,
    Delivered: <Check className="h-4 w-4" />,
    Cancelled: <X className="h-4 w-4" />,
};

const statusColors: { [key in Order['status']]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};


export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const userOrdersRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'orders');
  }, [firestore, user]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<Order>(userOrdersRef);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => b.orderDate.seconds - a.orderDate.seconds);
  }, [orders]);


  if (isUserLoading || areOrdersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    // This should ideally not happen if auth rules are set up,
    // but good practice to handle it.
    router.push('/'); // Redirect to home if not logged in
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background py-8 px-4">
       <Button onClick={() => router.push('/')} className="absolute top-4 left-4">
        Back to Home
      </Button>
      <div className="w-full max-w-4xl mt-16 space-y-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-32 h-32">
                   {user.photoURL ? (
                    <img src={user.photoURL} alt="User profile" />
                  ) : (
                    <AvatarFallback>
                      <UserIcon className="w-16 h-16" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{user.displayName || 'Anonymous User'}</h2>
              <p className="text-sm text-muted-foreground">{user.email || 'No email provided'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>A list of all your past and current orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedOrders && sortedOrders.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {sortedOrders.map((order) => (
                        <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4 items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <Hash className="h-5 w-5 text-muted-foreground" />
                                            {order.tokenNumber}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {format(new Date(order.orderDate.seconds * 1000), 'PP')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="text-base">
                                          ₹{order.totalAmount.toFixed(2)}
                                        </Badge>
                                        <Badge className={`flex items-center gap-2 ${statusColors[order.status]}`}>
                                          {statusIcons[order.status]}
                                          {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 bg-muted/50 rounded-md">
                                    <h4 className="font-semibold mb-2">Order Details</h4>
                                    <ul className="space-y-1 text-sm">
                                        {order.items.map(item => (
                                            <li key={item.id} className="flex justify-between">
                                                <span>{item.quantity} x {item.name}</span>
                                                <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span>₹{order.totalAmount.toFixed(2)}</span>
                                    </div>
                                     <p className="text-xs text-muted-foreground mt-4">
                                        Order ID: {order.id}
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    You haven't placed any orders yet.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
