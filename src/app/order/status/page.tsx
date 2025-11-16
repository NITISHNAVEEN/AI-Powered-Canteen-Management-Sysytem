'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, Loader, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    packaging: boolean;
    rated?: boolean;
};

type Order = {
    id: string;
    userId: string;
    catererId: string;
    items: OrderItem[];
    status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
    tokenNumber?: number;
};

const RatingForm = ({ order, item, itemIndex }: { order: Order; item: OrderItem, itemIndex: number }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitRating = async () => {
        if (rating === 0) {
            toast({ variant: 'destructive', title: "Please select a rating." });
            return;
        }
        if (!firestore) {
            toast({ variant: 'destructive', title: "Database connection not found." });
            return;
        }
        setIsSubmitting(true);

        const menuItemRef = doc(firestore, 'caterers', order.catererId, 'menuItems', item.id);
        const ratingColRef = collection(menuItemRef, 'ratings');
        const userOrderRef = doc(firestore, 'users', order.userId, 'orders', order.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const menuItemDoc = await transaction.get(menuItemRef);
                if (!menuItemDoc.exists()) {
                    throw new Error("Menu item not found!");
                }

                const oldRatingTotal = (menuItemDoc.data().averageRating || 0) * (menuItemDoc.data().numberOfRatings || 0);
                const newNumberOfRatings = (menuItemDoc.data().numberOfRatings || 0) + 1;
                const newAverageRating = (oldRatingTotal + rating) / newNumberOfRatings;

                // Update the menu item with the new average rating
                transaction.update(menuItemRef, {
                    averageRating: newAverageRating,
                    numberOfRatings: newNumberOfRatings,
                });
                
                // Add the new rating to the ratings subcollection
                const newRatingRef = doc(ratingColRef);
                transaction.set(newRatingRef, {
                    userId: order.userId,
                    orderId: order.id,
                    menuItemId: item.id,
                    rating,
                    review,
                    createdAt: serverTimestamp(),
                });

                // Update the 'rated' status in the order
                const orderDoc = await transaction.get(userOrderRef);
                if (orderDoc.exists()) {
                    const currentItems = orderDoc.data().items;
                    currentItems[itemIndex].rated = true;
                    transaction.update(userOrderRef, { items: currentItems });
                }
            });

            toast({ title: 'Thank you for your review!' });
        } catch (error) {
            console.error("Failed to submit rating:", error);
            toast({ variant: 'destructive', title: 'Failed to submit rating. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getImage = () => {
      // This is a bit of a hack since we don't have the category.
      // A better approach would be to store more item details in the order.
      const placeholder =
        PlaceHolderImages.find(p => item.name.toLowerCase().includes(p.id)) ||
        PlaceHolderImages.find(p => p.id === 'main-course') ||
        { imageUrl: 'https://picsum.photos/seed/placeholder/64/64' };
      return placeholder.imageUrl;
    }

    return (
        <Card>
            <CardContent className="p-4 flex flex-col gap-4">
                 <div className="flex items-center gap-4">
                    <Image src={getImage()} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                    <h4 className="font-semibold text-lg">{item.name}</h4>
                </div>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                "w-8 h-8 cursor-pointer transition-colors",
                                (hoverRating >= star || rating >= star)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                <Textarea 
                    placeholder="Tell us more about your experience (optional)"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />
                <Button onClick={handleSubmitRating} disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="animate-spin" /> : "Submit Review"}
                </Button>
            </CardContent>
        </Card>
    )
}

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
  
  const unratedItems = order?.items.filter(item => !item.rated) || [];

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
  
  if (order.status === 'Delivered') {
      return (
           <div className="w-full max-w-lg space-y-4">
              <Card className="text-center">
                 <CardHeader>
                    <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Order Delivered!</CardTitle>
                    <CardDescription>Thank you for your order. We hope you enjoyed it!</CardDescription>
                </CardHeader>
                <CardFooter className="flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href="/">Continue Shopping</Link>
                    </Button>
                </CardFooter>
              </Card>
              {unratedItems.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Rate Your Items</CardTitle>
                        <CardDescription>Your feedback helps us improve.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.items.map((item, index) => 
                            !item.rated ? (
                                <RatingForm key={item.id + index} order={order} item={item} itemIndex={index} />
                            ) : null
                        )}
                    </CardContent>
                 </Card>
              )}
           </div>
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

  // Confirmed state: Processing
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

    