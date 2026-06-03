import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Search, Filter, Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CampusMarketplace() {
  const { t } = useTranslation();

  const products = [
    { name: 'Used Calculus Textbook', price: 45.00, seller: 'Mike J.', rating: 4.8, img: '📚', tag: 'Books' },
    { name: 'Custom School Hoodie', price: 35.00, seller: 'Campus Crafters', rating: 5.0, img: '👕', tag: 'Merch' },
    { name: 'Scientific Calculator', price: 20.00, seller: 'Sarah L.', rating: 4.5, img: '🔢', tag: 'Electronics' },
    { name: '1-on-1 Physics Tutoring', price: 15.00, seller: 'TechTutors', rating: 4.9, img: '👨‍🏫', tag: 'Service' },
    { name: 'Art Supplies Kit', price: 25.00, seller: 'Emma W.', rating: 4.7, img: '🎨', tag: 'Supplies' },
    { name: 'Dorm Room Desk Lamp', price: 12.00, seller: 'John D.', rating: 4.2, img: '💡', tag: 'Dorm' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Campus Marketplace</h1>
            <p className="text-sm text-muted-foreground">Buy and sell items within the school community</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card"><ShoppingCart className="w-4 h-4 mr-2"/> Cart (2)</Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">Sell an Item</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search for books, electronics, services..." className="pl-9 bg-card py-6 rounded-xl shadow-sm border-border" />
        </div>
        <Button variant="outline" className="gap-2 bg-card py-6 rounded-xl px-6"><Filter className="w-4 h-4" /> Categories</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="h-48 bg-muted relative flex items-center justify-center text-6xl group-hover:bg-pink-50 transition-colors">
              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:text-pink-600 transition-colors shadow-sm">
                <Heart className="w-4 h-4" />
              </button>
              <span className="absolute top-3 left-3 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">{p.tag}</span>
              {p.img}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-foreground line-clamp-1 flex-1 pr-2">{p.name}</h3>
                <span className="font-black text-pink-600">${p.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">By {p.seller}</p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                  <Star className="w-3 h-3 fill-current" /> {p.rating}
                </div>
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs rounded-lg px-4">
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
