'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [iiitMailId, setIiitMailId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const generateUniqueCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleSignup = async () => {
    if (!auth || !firestore) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        iiitMailId,
        password
      );
      const user = userCredential.user;
      const uniqueCode = generateUniqueCode();

      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        id: user.uid,
        name,
        iiitMailId,
        phoneNumber,
        uniqueCode,
      };

      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      toast({ title: 'Signup successful!' });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">IIIT Email ID</Label>
              <Input
                id="email"
                type="email"
                placeholder="xyz@iiitdwd.ac.in"
                value={iiitMailId}
                onChange={(e) => setIiitMailId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleSignup} className="w-full">
              Sign Up
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Log in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
