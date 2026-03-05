"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { basePath as BP } from "@/lib/utils";
// Sub-pages route back to main dashboard with sidebar navigation active
export default function SubPage() {
    const router = useRouter();
    useEffect(() => { router.replace(`${BP}/shepherd/dashboard`); }, []);
    return null;
}
