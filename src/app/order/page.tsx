'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import Confetti from 'react-confetti';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};


export default function OrderSuccessPage() {
  const { width, height } = useWindowSize();
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/40">
      <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Order Placed Successfully!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your order is being processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                You can track the status of your order in your profile section.
            </p>
            <Button asChild>
                <Link href="/">Continue Shopping</Link>
            </Button>
             <Button variant="outline" asChild>
                <Link href="/profile">View Orders</Link>
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
