'use client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, addDocumentNonBlocking, setDoc, doc } from '@/firebase';
import { collection, serverTimestamp, getDocs, query, where, QuerySnapshot, DocumentData, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';


export default function CheckoutPage() {
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();
  const { firestore } = useFirebase();
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
  
  const generateUniqueToken = async (catererId: string): Promise<number> => {
    if (!firestore) throw new Error("Firestore is not initialized.");

    const ordersRef = collection(firestore, 'caterers', catererId, 'orders');
    const q = query(ordersRef, where('status', 'in', ['Pending', 'Processing']));
    
    const querySnapshot = await getDocs(q);
    const activeTokens = querySnapshot.docs.map(doc => doc.data().tokenNumber);

    let tokenNumber;
    let isUnique = false;

    while (!isUnique) {
      tokenNumber = Math.floor(Math.random() * 100) + 1;
      if (!activeTokens.includes(tokenNumber)) {
        isUnique = true;
      }
    }

    return tokenNumber!;
  };

  const handlePlaceOrder = async () => {
    if (!firestore || cartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must have items in your cart to place an order.',
      });
      return;
    }
    
    const catererId = cartItems[0]?.catererId;
    if (!catererId) {
        toast({ variant: 'destructive', title: 'Could not determine caterer.'});
        return;
    }
    
    try {
      const tokenNumber = await generateUniqueToken(catererId);
      const userId = uuidv4(); // Generate a unique ID for this anonymous order

      const orderData = {
        userId: userId,
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
        customerName: 'Anonymous User',
        customerEmail: null,
        tokenNumber: tokenNumber,
      };

      const catererOrdersRef = collection(firestore, 'caterers', catererId, 'orders');
      
      // Use `addDoc` which is more standard for creating a new document with an auto-generated ID
      const orderDocRef = await addDoc(catererOrdersRef, orderData);
      
      if (orderDocRef) {
        const userOrderDoc = doc(firestore, 'users', userId, 'orders', orderDocRef.id);
        await setDoc(userOrderDoc, orderData);
        
        // Store order reference in local storage
        if (typeof window !== 'undefined') {
            const pastOrders = JSON.parse(localStorage.getItem('pastOrders') || '[]');
            const newOrderRef = { orderId: orderDocRef.id, userId: userId };
            // Keep only the last 5 orders
            const updatedPastOrders = [newOrderRef, ...pastOrders].slice(0, 5); 
            localStorage.setItem('pastOrders', JSON.stringify(updatedPastOrders));
        }

        toast({
          title: 'Order Submitted!',
          description: `Your order has been sent to the caterer for confirmation.`,
        });
        clearCart();
        router.push(`/order/status?orderId=${orderDocRef.id}&userId=${userId}`);
      } else {
         throw new Error("Failed to create order document in caterer's collection.");
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      toast({
          variant: 'destructive',
          title: 'Failed to place order',
          description: 'There was an issue submitting your order. Please try again.',
      });
    }
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
