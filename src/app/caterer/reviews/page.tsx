// This is a new file
'use client';
import { Clock, Loader, MessageSquareQuote } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyzeReviews, AnalyzeReviewsOutput } from '@/ai/flows/analyze-reviews-flow';

type MenuItem = {
  id: string;
  name: string;
};

type Rating = {
  id: string;
  rating: number;
  review?: string;
};

const BulletedList = ({ content }: { content: string }) => {
  const items = content.split('*').map(s => s.trim()).filter(Boolean);
  if (items.length === 0 || (items.length === 1 && !items[0])) {
    return <p className="text-muted-foreground">No specific feedback provided.</p>;
  }
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};


export default function ReviewsPage() {
  const [currentTime, setCurrentTime] = useState('');
  const firestore = useFirestore();
  const catererId = 'demo-caterer';

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeReviewsOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const menuItemsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'caterers', catererId, 'menuItems');
  }, [firestore, catererId]);

  const { data: menuItems, isLoading: areMenuItemsLoading } = useCollection<MenuItem>(menuItemsRef);

  const ratingsRef = useMemoFirebase(() => {
      if (!firestore || !selectedMenuItemId) return null;
      return collection(firestore, `caterers/${catererId}/menuItems/${selectedMenuItemId}/ratings`);
  }, [firestore, catererId, selectedMenuItemId]);

  const { data: ratings, isLoading: areRatingsLoading } = useCollection<Rating>(ratingsRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
      if (selectedMenuItemId && ratings) {
          const runAnalysis = async () => {
              const selectedItem = menuItems?.find(item => item.id === selectedMenuItemId);
              if (!selectedItem) return;

              setIsLoadingAnalysis(true);
              setAnalysis(null);
              try {
                  const result = await analyzeReviews({
                      menuItemName: selectedItem.name,
                      reviews: ratings.map(r => ({ rating: r.rating, review: r.review || '' })),
                  });
                  setAnalysis(result);
              } catch (error) {
                  console.error("Failed to analyze reviews:", error);
                  setAnalysis({
                      positiveSummary: 'Could not load analysis.',
                      negativeSummary: 'Could not load analysis.',
                      improvementSuggestions: 'Could not load analysis.',
                  });
              } finally {
                  setIsLoadingAnalysis(false);
              }
          };
          runAnalysis();
      }
  }, [selectedMenuItemId, ratings, menuItems]);


  const menuLinks = ['Dashboard', 'Orders', 'Menu Items', 'Categories', 'Reviews'];
  
  const selectedMenuItem = menuItems?.find(item => item.id === selectedMenuItemId);

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">Caterer Admin</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuLinks.map((item) => (
              <SidebarMenuItem key={item}>
                <Link href={item === 'Menu Items' ? '/caterer' : `/caterer/${item.toLowerCase().replace(' ', '-')}`} className="w-full">
                  <SidebarMenuButton isActive={item === 'Reviews'}>
                    {item}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 border rounded-md" style={{ backgroundColor: '#CBF7DA' }}>
              <Clock className="w-5 h-5" />
              <span>{currentTime} IST</span>
            </div>
             <Button asChild variant="outline" style={{ backgroundColor: '#D7F5E1', color: 'black' }}>
                <Link href="/">View User Site</Link>
              </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Review Analysis</h1>
            <div className="w-full max-w-sm">
                <Select onValueChange={setSelectedMenuItemId} disabled={areMenuItemsLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a menu item to analyze..." />
                    </SelectTrigger>
                    <SelectContent>
                        {menuItems && menuItems.length > 0 ? menuItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        )) : <SelectItem value="none" disabled>No menu items found</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          {!selectedMenuItemId ? (
              <Card className="flex flex-col items-center justify-center py-24">
                 <CardHeader className="text-center">
                    <MessageSquareQuote className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle className="mt-4">Select an Item</CardTitle>
                    <CardDescription>Choose a menu item to see its AI-powered review analysis.</CardDescription>
                 </CardHeader>
              </Card>
          ) : (isLoadingAnalysis || areRatingsLoading) ? (
              <Card>
                  <CardHeader>
                        <CardTitle>Analyzing reviews for "{selectedMenuItem?.name}"...</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-20">
                      <Loader className="w-12 h-12 animate-spin text-primary" />
                  </CardContent>
              </Card>
          ) : analysis ? (
              <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Positive Feedback</CardTitle>
                        <CardDescription>What customers loved about "{selectedMenuItem?.name}".</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BulletedList content={analysis.positiveSummary} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Negative Feedback</CardTitle>
                        <CardDescription>What customers thought could be better.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BulletedList content={analysis.negativeSummary} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>AI Suggestions for Improvement</CardTitle>
                        <CardDescription>Actionable ideas to make "{selectedMenuItem?.name}" even better.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BulletedList content={analysis.improvementSuggestions} />
                    </CardContent>
                </Card>
              </div>
          ) : (
             <Card className="flex flex-col items-center justify-center py-24">
                 <CardHeader className="text-center">
                    <MessageSquareQuote className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle className="mt-4">No Reviews Found</CardTitle>
                    <CardDescription>This item doesn't have any reviews to analyze yet.</CardDescription>
                 </CardHeader>
              </Card>
          )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
