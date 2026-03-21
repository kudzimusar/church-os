"use client";
import { useState } from "react";
import { useStickyForm } from "@/hooks/useStickyForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addMemberAction } from "@/app/actions/admin";
import { Users } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";

export function MemberForm({ onSuccess }: { onSuccess: () => void }) {
    const { orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);
    const { values, handleChange, clear } = useStickyForm({
        name: "",
        email: "",
        phone: "",
        city: ""
    }, "admin-add-member");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const result = await addMemberAction({ ...values, orgId });

        if (result.success) {
            toast.success("Member added successfully!");
            clear();
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Full Name</label>
                    <Input name="name" value={values.name} onChange={e => handleChange('name', e.target.value)} placeholder="John Doe" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Email</label>
                    <Input name="email" value={values.email} onChange={e => handleChange('email', e.target.value)} type="email" placeholder="john@example.com" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Phone</label>
                    <Input name="phone" value={values.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+81..." className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">City</label>
                    <Input name="city" value={values.city} onChange={e => handleChange('city', e.target.value)} placeholder="Tokyo" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-xl shadow-lg shadow-primary/20 transition-all">
                {loading ? "Adding Member..." : "Complete Onboarding"}
            </Button>
        </form>
    );
}
