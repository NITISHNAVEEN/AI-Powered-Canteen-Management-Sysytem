'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined') {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

type Order = {
    id: string;
    status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
    tokenNumber?: number;
};

function OrderStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId');
  const { width, height } = useWindowSize();
  const firestore = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !userId || !orderId) return null;
    return doc(firestore, 'users', userId, 'orders', orderId);
  }, [firestore, userId, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (order?.status && ['Processing', 'Delivered'].includes(order.status)) {
        setShowConfetti(true);
    }
  }, [order?.status])

  if (isLoading) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-fit">
                <Loader className="w-12 h-12 text-gray-500 animate-spin" />
            </div>
          <CardTitle className="mt-4 text-2xl font-bold">Loading Order Status...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!order) {
    return (
        <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full p-4 w-fit">
                <XCircle className="w-12 h-12 text-red-600" />
            </div>
          <CardTitle className="mt-4 text-2xl font-bold">Order Not Found</CardTitle>
          <CardDescription>We couldn't find details for this order. It might have been cancelled or there was an error.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href="/">Continue Shopping</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === 'Pending') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-yellow-100 rounded-full p-4 w-fit">
                <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          <CardTitle className="mt-4 text-2xl font-bold">Waiting for Confirmation</CardTitle>
          <CardDescription>
            Your order has been submitted. We are waiting for the caterer to confirm it. This page will update automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (order.status === 'Cancelled') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full p-4 w-fit">
                <XCircle className="w-12 h-12 text-red-600" />
            </div>
          <CardTitle className="mt-4 text-2xl font-bold">Order Cancelled</CardTitle>
          <CardDescription>
            Unfortunately, the caterer was unable to fulfill your order.
          </CardDescription>
        </CardHeader>
        <CardContent>
             <Button asChild>
                <Link href="/">Continue Shopping</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  // Confirmed states: Processing, Delivered
  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} tweenDuration={10000} />}
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Order Confirmed!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your order is now {order.status.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {order.tokenNumber && (
            <div className="my-4">
              <p className="text-sm text-muted-foreground">Your unique order token is:</p>
              <p className="text-8xl font-bold tracking-wider text-primary">{order.tokenNumber}</p>
            </div>
          )}
          <Button asChild>
              <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}


export default function OrderStatusPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
                <OrderStatusContent />
            </main>
        </Suspense>
    )
}
