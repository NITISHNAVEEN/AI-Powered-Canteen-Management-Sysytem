'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FoodTypeFilter = 'all' | 'veg' | 'non-veg';

export default function FiltersPage() {
  const router = useRouter();
  const [foodType, setFoodType] = useState<FoodTypeFilter>('all');
  const [price, setPrice] = useState([200]);

  const handleApplyFilters = () => {
    // For now, this will just navigate back.
    // In a future step, we'll pass the filter state back to the main page.
    console.log({ foodType, price: price[0] });
    router.push('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/40">
       <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Filter Menu</CardTitle>
          <CardDescription>
            Refine your search based on your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Food Type</Label>
            <RadioGroup
              value={foodType}
              onValueChange={(value) => setFoodType(value as FoodTypeFilter)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="r-all" />
                <Label htmlFor="r-all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="veg" id="r-veg" />
                <Label htmlFor="r-veg">Veg</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-veg" id="r-non-veg" />
                <Label htmlFor="r-non-veg">Non-Veg</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Max Price</Label>
                <span className="text-base font-bold text-primary">₹{price[0]}</span>
            </div>
            <Slider
              value={price}
              onValueChange={setPrice}
              max={500}
              step={10}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
