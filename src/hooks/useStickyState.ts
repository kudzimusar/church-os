"use client";
import React, { useState, useEffect } from "react";

/**
 * A hook that works like useState but persists the value to localStorage.
 * Useful for single draft fields (like a search bar or a quick-add input).
 */
export function useStickyState<T>(defaultValue: T, key: string) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return defaultValue;
        const stickyValue = window.localStorage.getItem(`sticky_state:${key}`);
        return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    });

    useEffect(() => {
        window.localStorage.setItem(`sticky_state:${key}`, JSON.stringify(value));
    }, [key, value]);

    const clear = () => {
        window.localStorage.removeItem(`sticky_state:${key}`);
        setValue(defaultValue);
    };

    return [value, setValue, clear] as const;
}
