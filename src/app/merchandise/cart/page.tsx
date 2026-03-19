"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, Plus, Minus, ShoppingBag, 
    ArrowRight, ArrowLeft, CreditCard,
    ShieldCheck, Truck, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { getCurrencySymbol } from "@/lib/shop-service";

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
        setCart(savedCart);
        setLoading(false);
    }, []);

    const updateQuantity = (id: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        setCart(newCart);
        localStorage.setItem("merchandise_cart", JSON.stringify(newCart));
    };

    const removeItem = (id: string) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        localStorage.setItem("merchandise_cart", JSON.stringify(newCart));
        toast.info("Item removed from cart");
    };

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 10000 ? 0 : 500;
    const total = subtotal + shipping;

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <PublicNav />
                <div className="flex-1 flex items-center justify-center pt-40">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <ShoppingBag className="text-primary w-10 h-10" />
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNav />
            
            <main className="flex-1 pt-24 md:pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Your Kingdom Cart</h1>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
                                <ShieldCheck size={14} className="text-primary" /> 100% Secure Checkout Guaranteed
                            </p>
                        </div>
                        <Link href="/merchandise">
                            <Button variant="ghost" className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/10 hover:text-primary transition-all">
                                <ArrowLeft size={16} className="mr-2" /> Continue Shopping
                            </Button>
                        </Link>
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-40 border-2 border-dashed border-border rounded-[3rem] bg-card/30">
                            <ShoppingBag size={80} className="mx-auto mb-8 text-muted-foreground opacity-10" />
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-4 text-foreground">Cart is currently empty</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-10 font-medium">Your harvest is empty. Head back to our collection to find something special.</p>
                            <Link href="/merchandise">
                                <Button className="rounded-[2rem] font-black uppercase tracking-widest text-xs h-16 w-64 bg-primary shadow-xl shadow-primary/20">Start Exploring</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                            {/* Items List */}
                            <div className="lg:col-span-2 space-y-6">
                                <AnimatePresence>
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="group relative overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 pr-10 hover:border-primary/30 transition-all shadow-sm"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-8">
                                                <div className="w-32 h-32 bg-muted rounded-3xl overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                                                    {item.images?.[0] ? (
                                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package size={32} className="text-muted-foreground opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col justify-between py-1">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic mt-1">Global Kingdom Shipping Eligible</p>
                                                            </div>
                                                            <button onClick={() => removeItem(item.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/5">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6">
                                                        <div className="flex items-center gap-2 bg-muted/50 rounded-2xl p-1 w-fit border border-border/50">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white transiton-colors text-foreground">
                                                                <Minus size={16} />
                                                            </button>
                                                            <span className="w-12 text-center font-black text-sm">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white transiton-colors text-foreground">
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="text-2xl font-black text-primary group-hover:scale-110 transition-transform origin-right">
                                                            {getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{(item.price * item.quantity).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-8 lg:sticky lg:top-36">
                                <Card className="rounded-[3rem] border-none bg-card p-10 shadow-sm border border-border/50">
                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Order Summary</h3>
                                    
                                    <div className="space-y-6 mb-8 text-sm font-bold uppercase tracking-widest">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span className="text-foreground">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Shipping</span>
                                            <span className="text-foreground">{shipping === 0 ? "FREE" : `${getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}${shipping.toLocaleString()}`}</span>
                                        </div>
                                        <div className="pt-6 border-t border-border/50 flex justify-between text-2xl font-black">
                                            <span className="tracking-tight text-foreground">Grand Total</span>
                                            <span className="text-primary">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Link href="/merchandise/checkout">
                                            <Button className="w-full h-18 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 h-16 transition-all active:scale-95">
                                                Proceed to Checkout <ArrowRight size={18} className="ml-3" />
                                            </Button>
                                        </Link>
                                        <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
                                            <CreditCard size={14} className="text-primary" /> Supported by Stripe & PayPal
                                        </div>
                                    </div>

                                    <div className="mt-10 p-6 bg-muted/20 rounded-[2.5rem] space-y-4 border border-border/10">
                                        <div className="flex items-center gap-3">
                                            <Truck className="text-primary" size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Express Kingdom Delivery</span>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold">
                                            Your order will be shipped within 24-48 hours from our central harvest facility.
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
