'use client';
import { useState, useEffect } from 'react';
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
import { useFilters } from '@/hooks/use-filters';

export default function FiltersPage() {
  const router = useRouter();
  const { filters, setFilters, isFiltersLoading } = useFilters();

  // Local state to manage form inputs before applying them
  const [foodType, setFoodType] = useState(filters.foodType);
  const [priceRange, setPriceRange] = useState(filters.priceRange);

  // Update local state when filters are loaded from localStorage
  useEffect(() => {
    if (!isFiltersLoading) {
      setFoodType(filters.foodType);
      setPriceRange(filters.priceRange);
    }
  }, [isFiltersLoading, filters]);

  const handleApplyFilters = () => {
    setFilters({ foodType, priceRange });
    router.push('/');
  };
  
  const handleResetFilters = () => {
      const defaultFilters = { foodType: 'all' as const, priceRange: [0, 500] as [number, number]};
      setFoodType(defaultFilters.foodType);
      setPriceRange(defaultFilters.priceRange);
      setFilters(defaultFilters);
      router.push('/');
  }

  if (isFiltersLoading) {
      return <div className="flex h-screen items-center justify-center">Loading filters...</div>
  }

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
              onValueChange={(value) => setFoodType(value as 'all' | 'veg' | 'non-veg')}
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
              <Label className="text-base font-semibold">Price Range</Label>
              <span className="text-base font-bold text-primary">
                ₹{priceRange[0]} - ₹{priceRange[1]}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={500}
              step={10}
              minStepsBetweenThumbs={1}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
          <Button className="w-full" variant="ghost" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
