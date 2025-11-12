'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Edit2 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: 'Logged out successfully' });
      router.push('/login');
    }
  };

  if (!isClient || isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background py-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Avatar className="w-32 h-32">
                <AvatarFallback>
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Add profile photo</p>
            <h2 className="mt-4 text-2xl font-semibold">{user.displayName || user.email}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">USERNAME</p>
                <p>{user.displayName || user.email}</p>
              </div>
              <Button variant="outline">CHANGE USERNAME</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">PASSWORD</p>
                <p>••••••••</p>
              </div>
              <Button variant="outline">CHANGE PASSWORD</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">ORDER HISTORY</p>
              </div>
              <Button variant="outline">VIEW HISTORY</Button>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full mt-8"
            onClick={handleLogout}
          >
            LOG OUT
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
