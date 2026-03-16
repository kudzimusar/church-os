"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyPastorLoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace("/login/");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
