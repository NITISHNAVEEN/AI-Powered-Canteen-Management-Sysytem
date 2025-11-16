'use client';

import { useState, useEffect, useCallback } from 'react';

const FILTERS_STORAGE_KEY = 'menuFilters';

type FoodTypeFilter = 'all' | 'veg' | 'non-veg';
type PriceRange = [number, number];

interface Filters {
  foodType: FoodTypeFilter;
  priceRange: PriceRange;
}

const defaultFilters: Filters = {
  foodType: 'all',
  priceRange: [0, 500],
};

export function useFilters() {
  const [filters, setInternalFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (storedFilters) {
        setInternalFilters(JSON.parse(storedFilters));
      }
    } catch (error) {
      console.error("Failed to parse filters from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  const setFilters = useCallback((newFilters: Filters) => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
      setInternalFilters(newFilters);
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, []);

  return { filters, setFilters, isFiltersLoading: isLoading };
}
