'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Edit2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';


export default function ProfilePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background py-8">
       <Button onClick={() => router.push('/')} className="absolute top-4 left-4">
        Back to Home
      </Button>
      <Card className="w-full max-w-2xl mt-16">
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
            <h2 className="mt-4 text-2xl font-semibold">Anonymous User</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">USERNAME</p>
                <p>Anonymous User</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">ORDER HISTORY</p>
              </div>
              <Button variant="outline">VIEW HISTORY</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
