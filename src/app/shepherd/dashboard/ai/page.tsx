"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function SubPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/jkc-devotion-app/shepherd/dashboard"); }, []);
    return null;
}
