import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-1000">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Genesis Landing
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          A clean, responsive, and beautifully simple starting point for your next big idea. Built for performance and designed for delight.
        </p>
        <Button size="lg" className="group">
          Get Started
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </main>
  );
}
