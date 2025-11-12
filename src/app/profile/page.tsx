'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Edit2 } from 'lucide-react';
import { useAuth, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { updateProfile } from 'firebase/auth';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type UserProfile = {
  name: string;
  iiitMailId: string;
  phoneNumber: string;
  uniqueCode: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<UserProfile>(userDocRef);

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

  const handleChangeUsername = async () => {
    if (!user || !userDocRef) return;
    try {
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newUsername });
      }
      updateDocumentNonBlocking(userDocRef, { name: newUsername });
      toast({ title: 'Username updated successfully!' });
      setNewUsername('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating username',
        description: error.message,
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth?.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: 'Password updated successfully!' });
      setNewPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating password',
        description: error.message,
      });
    }
  };

  if (!isClient || isUserLoading || isProfileLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const displayName = userProfile?.name || user.displayName || user.email;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background py-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Avatar className="w-32 h-32">
                <AvatarFallback>
                  <UserIcon className="w-16 h-16" />
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
            <h2 className="mt-4 text-2xl font-semibold">{displayName}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">USERNAME</p>
                <p>{displayName}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">CHANGE USERNAME</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Username</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter new username"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="submit"
                        onClick={handleChangeUsername}
                        disabled={!newUsername}
                      >
                        Save changes
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">PASSWORD</p>
                <p>••••••••</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">CHANGE PASSWORD</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        New Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="submit"
                        onClick={handleChangePassword}
                        disabled={!newPassword}
                      >
                        Save changes
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
