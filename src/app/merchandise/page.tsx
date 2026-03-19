"use client";

import { useState, useEffect } from "react";
import { 
    ShoppingBag, ShoppingCart, ArrowRight, 
    Package, Loader2, Sparkles, Filter,
    Search, ChevronRight, Star, Truck,
    Heart, LayoutGrid, List, ShieldCheck, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { ShopService, Merchandise, getCurrencySymbol } from "@/lib/shop-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function MerchandisePage() {
    const [products, setProducts] = useState<Merchandise[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Japan Kingdom Church ORG_ID
    const ORG_ID = "fa547adf-f820-412f-9458-d6bade11517d"; 

    useEffect(() => {
        loadProducts();
        updateCartCount();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            const productsData = await ShopService.getProducts(ORG_ID);
            setProducts(productsData);
        } catch (err) {
            console.error(err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
        setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    };

    const addToCart = (product: Merchandise) => {
        const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
        const existingItem = cart.find((item: any) => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ 
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images,
                org_id: product.org_id,
                quantity: 1 
            });
        }
        
        localStorage.setItem("merchandise_cart", JSON.stringify(cart));
        updateCartCount();
        toast.success(`${product.name} added to cart!`);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <PublicNav />
            
            {/* 1. PREMIUM HEADER / NAV (Hidden if PublicNav is present, but I'll keep the search bar logic or just use PublicNav) */}
            <div className="pt-24 md:pt-32">
                <header className="bg-white/80 backdrop-blur-2xl border-b border-border/50 sticky top-16 z-40">
                    <div className="container mx-auto max-w-7xl px-4 h-16 md:h-20 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="hidden md:flex items-center bg-muted/50 rounded-2xl px-4 h-11 w-80 border border-border/50">
                                <Search size={16} className="text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Search the collection..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest px-3 w-full placeholder:text-muted-foreground/40"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href="/merchandise/cart">
                                <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0">
                                    <ShoppingCart size={18} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
                                            {cartCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>
            </div>

            {/* 2. HERO / CAMPAIGN */}
            <section className="bg-foreground text-background py-20 px-4 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                    {/* Abstract kingdom pattern background */}
                    <div className="grid grid-cols-12 h-full opacity-20">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border border-background/20" />
                        ))}
                    </div>
                </div>
                
                <div className="container mx-auto max-w-7xl relative z-10 text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
                            >
                                <Sparkles size={16} className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">Kingdom Exclusive Collection</span>
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">New Arrival by Pastor Marcel</h2>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-[0.85]">
                                    THE KINGDOM <br /><span className="text-primary italic">AWAKENING</span>
                                </h1>
                            </motion.div>
                            
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg text-white/60 font-medium max-w-sm"
                            >
                                Discover the divine protocols and supernatural life God designed specifically for your purpose.
                            </motion.p>
                                                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <Link href="/merchandise/the-kingdom-awakening">
                                    <Button className="h-16 px-10 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-white/90 shadow-2xl w-full sm:w-auto">
                                        Order Now - {getCurrencySymbol(ORG_ID)}2,200
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={() => {
                                    const el = document.getElementById('collection');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }} className="h-16 px-10 rounded-full border-2 border-white/20 text-white font-black text-xs uppercase tracking-widest bg-transparent hover:bg-white/10 w-full sm:w-auto">
                                    Explore Full Collection
                                </Button>
                            </div>
                        </div>

                        {/* Visual element (Mockup placeholder) */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            className="hidden md:block relative aspect-square"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/10 flex items-center justify-center p-12">
                                <Package size={200} className="text-white opacity-20" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-gradient-to-br from-primary via-primary to-accent rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform rotate-6 border-4 border-white/20 overflow-hidden">
                                     <div className="w-full h-full bg-black/20 flex items-center justify-center">
                                         <Star size={120} fill="white" className="text-white opacity-40 shadow-2xl" />
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. COLLECTION AREA */}
            <main className="container mx-auto max-w-7xl px-4 py-20">
                {/* Search & Filter Bar (Mobile) */}
                <div className="flex md:hidden flex-col gap-4 mb-12">
                    <div className="flex items-center bg-white rounded-2xl px-4 h-14 border-2 border-border/50">
                        <Search size={18} className="text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Find kingdom gear..."
                            className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest px-3 w-full"
                        />
                    </div>
                </div>

                {/* Filters & Sorting */}
                <div id="collection" className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-2 scroll-mt-32">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-4xl font-black uppercase tracking-tight">The Collection</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Found {filteredProducts.length} Premium Items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border-2 border-border/50 rounded-xl p-1">
                            <Button 
                                variant={viewMode === "grid" ? "default" : "ghost"} 
                                size="icon" 
                                onClick={() => setViewMode("grid")}
                                className="h-8 w-8 rounded-lg"
                            >
                                <LayoutGrid size={16} />
                            </Button>
                            <Button 
                                variant={viewMode === "list" ? "default" : "ghost"} 
                                size="icon" 
                                onClick={() => setViewMode("list")}
                                className="h-8 w-8 rounded-lg"
                            >
                                <List size={16} />
                            </Button>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Filter size={14} /> Refine
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <p className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Gathering Global Harvest...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-40 border-4 border-dashed border-border rounded-[4rem] bg-white">
                        <Package size={80} className="mx-auto mb-8 text-muted-foreground opacity-20" />
                        <h3 className="text-4xl font-black uppercase tracking-tight mb-4">Stock In Transit</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto font-medium">Our collection is currently being restocked for the new season. Check back soon for the Kingdom exclusive drop.</p>
                        <Button variant="outline" onClick={loadProducts} className="mt-10 rounded-full h-14 px-10 font-black uppercase text-xs tracking-widest border-2">Refresh Store</Button>
                    </div>
                ) : (
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10" 
                        : "flex flex-col gap-6"
                    }>
                        {filteredProducts.map((product, idx) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: idx * 0.05 }}
                            >
                                <Card className={`group relative overflow-hidden bg-white border-none transition-all duration-700 rounded-[2.5rem] md:rounded-[3rem] shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] ${viewMode === "list" ? "flex flex-row h-48" : "flex flex-col"}`}>
                                    {/* Link covers the image and title area but not the CTA button */}
                                    <div className="relative">
                                        <Link href={`/merchandise/${product.slug}`} className="block overflow-hidden">
                                            {/* Product Image */}
                                            <div className={`${viewMode === "list" ? "w-48 h-full" : "aspect-[3/4]"} relative overflow-hidden`}>
                                                <AnimatePresence>
                                                    <img 
                                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                                    />
                                                </AnimatePresence>
                                                
                                                {/* Overlays */}
                                                <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-2 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-top-left z-10">
                                                    <Button size="icon" className="h-8 md:h-10 w-8 md:w-10 rounded-full bg-white text-black hover:bg-white/90 shadow-xl border-none">
                                                        <Heart size={14} className="md:size-4" />
                                                    </Button>
                                                </div>

                                                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                                                    <div className="absolute top-4 md:top-6 right-4 md:right-6 z-10">
                                                        <Badge className="bg-red-500 text-white font-black text-[7px] md:text-[8px] px-2 md:px-3 py-1 rounded-full uppercase tracking-widest border-none">LOW STOCK</Badge>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                            </div>
                                        </Link>

                                        <CardContent className={`p-5 md:p-8 pb-8 md:pb-10 flex flex-col ${viewMode === "list" ? "flex-1 justify-center" : "flex-shrink-0"}`}>
                                            <div className="space-y-3 md:space-y-4">
                                                <Link href={`/merchandise/${product.slug}`} className="block group/title">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-[0.3em]">{product.category?.name || 'Publication'}</span>
                                                        <h3 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight group-hover/title:text-primary transition-colors leading-tight line-clamp-2">
                                                            {product.name}
                                                        </h3>
                                                    </div>
                                                </Link>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="text-xl md:text-3xl font-black text-foreground">{getCurrencySymbol(ORG_ID)}{product.price.toLocaleString()}</div>
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Star size={10} fill="currentColor" />
                                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-0.5">4.9</span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-xs md:text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed h-10 md:h-auto">
                                                    {product.description}
                                                </p>
                                                
                                                <div className="pt-2 md:pt-4 flex flex-col gap-2 md:gap-3">
                                                    <Button 
                                                        onClick={() => addToCart(product)}
                                                        disabled={product.stock_quantity === 0}
                                                        className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-foreground hover:bg-black text-background font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-black/5 active:scale-95 transition-all"
                                                    >
                                                        <ShoppingBag className="mr-2 md:mr-3" size={14} />
                                                        Add to Cart
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* 4. VALUE PROPS / TRUST */}
            <section className="py-32 border-t border-border/50 bg-white">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <Truck size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Rapid Global Logistics</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Seamless shipping across Japan and to all nations. EMS, Yamato, and Sagawa integrated.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <ShieldCheck size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Kingdom Secure Checkout</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Bank-grade encryption for all transactions. Visa, Mastercard, Stripe, and PayPal accepted.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <RefreshCcw size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Satisfaction Guarantee</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Not satisfied with your kingdom gear? We offer extended 30-day exchange windows for all orders.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-foreground text-background">
                <div className="container mx-auto max-w-5xl px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Fuel the Harvest</h2>
                    <p className="text-lg font-medium text-white/60 mb-12 max-w-2xl mx-auto italic">
                        Every purchase directly funds our Japan and Global mission outreaches. Join the movement.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="JOIN THE KINGDOM LIST" 
                            className="h-16 rounded-full bg-white/10 border border-white/20 px-8 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-white/30 flex-1"
                        />
                        <Button className="h-16 px-10 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90">SUBSCRIBE</Button>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
