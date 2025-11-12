import { Clock, User } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const menuItems = [
    "Recommendations",
    "Paratha",
    "Burger",
    "Rolls",
    "Biryani",
    "Quick Snacks",
    "Main Course",
  ];

  const foodItems = [
    {
      name: "Paratha",
      description:
        "The well cooked potato paratha with butter and groundnut chutney.",
      price: 45,
      available: true,
      image: "https://picsum.photos/seed/1/150/100",
      imageHint: "paratha food",
    },
    {
      name: "Classic Burger",
      description: "A juicy beef patty with fresh vegetables and our special sauce.",
      price: 120,
      available: true,
      image: "https://picsum.photos/seed/2/150/100",
      imageHint: "burger food",
    },
    {
      name: "Chicken Biryani",
      description: "Aromatic basmati rice cooked with succulent chicken pieces.",
      price: 180,
      available: false,
      image: "https://picsum.photos/seed/3/150/100",
      imageHint: "biryani food",
    },
    {
      name: "Veggie Rolls",
      description: "Crispy rolls filled with fresh vegetables and spices.",
      price: 60,
      available: true,
      image: "https://picsum.photos/seed/4/150/100",
      imageHint: "rolls food",
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">APP NAME</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item, index) => (
              <SidebarMenuItem key={item}>
                <SidebarMenuButton
                  isActive={item === "Recommendations"}
                >
                  {item}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Clock className="w-5 h-5" />
              <span>08:00 am IST</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-8 h-8 p-1.5 border rounded-full" />
              <span>User Mode</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="grid gap-4">
            {foodItems.map((item) => (
              <Card key={item.name}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="object-cover w-24 h-24 rounded-md"
                    data-ai-hint={item.imageHint}
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-bold">{item.name}</h3>
                      <span
                        className={`text-sm ${
                          item.available ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ({item.available ? "Available" : "Not Available"})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold">₹{item.price}</p>
                    <Button asChild>
                      <Link href="/order">Order</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        
        <footer className="sticky bottom-0 flex items-center justify-between p-4 bg-background border-t">
          <Button variant="outline" asChild>
            <Link href="/filters">Use filters</Link>
          </Button>
          <Button asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}