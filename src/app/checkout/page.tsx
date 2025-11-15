'use client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, addDocumentNonBlocking, useUser, setDocumentNonBlocking, doc } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getImage = (item: any) => {
    const placeholder =
      PlaceHolderImages.find(p => p.id === (item.category || '').toLowerCase().replace(/[\s_]+/g, '-')) ||
      PlaceHolderImages.find(p => p.id === 'main-course') ||
      { imageUrl: 'https://picsum.photos/seed/placeholder/96/96', imageHint: 'food item' };
    return item.imageUrl || placeholder.imageUrl;
  }

  const handlePlaceOrder = () => {
    if (!firestore || !user || cartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in and have items in your cart to place an order.',
      });
      return;
    }
    
    const catererId = cartItems[0]?.catererId;
    if (!catererId) {
        toast({ variant: 'destructive', title: 'Could not determine caterer.'});
        return;
    }

    const tokenNumber = Math.floor(Math.random() * 100) + 1;

    const orderData = {
      userId: user.uid,
      catererId: catererId,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: total,
      status: 'Pending' as const,
      orderDate: serverTimestamp(),
      customerName: user.displayName || 'Anonymous User',
      customerEmail: user.email || null,
      tokenNumber: tokenNumber,
    };
    
    // 1. Add order to caterer's collection
    const catererOrdersRef = collection(firestore, 'caterers', catererId, 'orders');
    addDocumentNonBlocking(catererOrdersRef, orderData)
      .then(orderDocRef => {
        // This block executes on successful write to the caterer's collection
        if (orderDocRef) {
          // 2. Add same order to user's collection, using the same ID for consistency
          const userOrderDoc = doc(firestore, 'users', user.uid, 'orders', orderDocRef.id);
          // Use setDocumentNonBlocking here to ensure the ID is the same
          setDocumentNonBlocking(userOrderDoc, orderData, { merge: false });
        }
        
        toast({
          title: 'Order Placed!',
          description: `Your order token is #${tokenNumber}. It has been successfully placed.`,
        });
        clearCart();
        router.push('/order');
      })
      .catch(error => {
        // This catch is for client-side errors or if the non-blocking function re-throws.
        // The permission error is handled inside `addDocumentNonBlocking`.
        console.error("Order placement failed:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to place order',
            description: 'There was an issue submitting your order. Please try again.',
        });
      });
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="mb-4">Your cart is empty.</p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Image
                    src={getImage(item)}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-semibold w-20 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-end items-center gap-4 font-bold text-xl">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={clearCart}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
            </Button>
            <Button size="lg" onClick={handlePlaceOrder}>
                Place Order
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
