'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';

export default function LoginPage() {
  const [isCaterer, setIsCaterer] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async () => {
    if (!auth) return;

    const persistence = keepLoggedIn
      ? browserLocalPersistence
      : browserSessionPersistence;

    try {
      await setPersistence(auth, persistence);

      if (isCaterer) {
        if (email === 'admin' && password === 'password') {
          // For prototyping, we'll use a known account for the caterer.
          // In a real app, you'd have a separate secure login mechanism.
          initiateEmailSignIn(auth, 'caterer.admin@app.com', 'password');
          toast({ title: 'Caterer login successful' });
          router.push('/caterer');
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid caterer credentials',
          });
        }
      } else {
        initiateEmailSignIn(auth, email, password);
        toast({ title: 'Login successful' });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  if (!isClient || isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isCaterer ? 'Caterer Login' : 'User Login'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4 space-x-2">
            <Label htmlFor="role-switch">User</Label>
            <Switch
              id="role-switch"
              checked={isCaterer}
              onCheckedChange={setIsCaterer}
            />
            <Label htmlFor="role-switch">Caterer</Label>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{isCaterer ? 'Username' : 'Email'}</Label>
              <Input
                id="email"
                type={isCaterer ? 'text' : 'email'}
                placeholder={isCaterer ? 'admin' : 'user@iiit.ac.in'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keep-logged-in"
                checked={keepLoggedIn}
                onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
              />
              <Label htmlFor="keep-logged-in">Keep me logged in</Label>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            {!isCaterer && (
              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <a
                  href="/signup"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign up
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
