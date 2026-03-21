"use client";

import React, { useState, useEffect, useCallback } from 'react';

/**
 * A hook to persist form state in localStorage.
 * Useful for "sticky" fields that should survive page refreshes or failed submissions.
 */
export function useStickyForm<T extends Record<string, any>>(
    initialValues: T,
    storageKey: string
) {
    // Initialize state from localStorage if available, otherwise use initialValues
    const [values, setValues] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValues;
        
        try {
            const saved = localStorage.getItem(`sticky_form:${storageKey}`);
            return saved ? { ...initialValues, ...JSON.parse(saved) } : initialValues;
        } catch (error) {
            console.error("Error loading sticky form data:", error);
            return initialValues;
        }
    });

    // Update localStorage whenever values change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        try {
            localStorage.setItem(`sticky_form:${storageKey}`, JSON.stringify(values));
        } catch (error) {
            console.error("Error saving sticky form data:", error);
        }
    }, [values, storageKey]);

    const handleChange = useCallback((nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: any) => {
        if (typeof nameOrEvent === 'string') {
            setValues(prev => ({ ...prev, [nameOrEvent]: value }));
        } else {
            const target = nameOrEvent.target as HTMLInputElement;
            const { name, value: newValue, type, checked } = target;
            const finalValue = type === 'checkbox' ? checked : newValue;
            setValues(prev => ({ ...prev, [name]: finalValue }));
        }
    }, []);

    const setAllValues = useCallback((newValues: Partial<T> | ((prev: T) => T)) => {
        if (typeof newValues === 'function') {
            // @ts-ignore - for functional updates
            setValues(prev => newValues(prev));
        } else {
            setValues(prev => ({ ...prev, ...newValues }));
        }
    }, [setValues]);

    const clear = useCallback(() => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`sticky_form:${storageKey}`);
        setValues(initialValues);
    }, [initialValues, storageKey]);

    return {
        values,
        setValues: setAllValues as (vals: Partial<T> | ((prev: T) => T)) => void,
        handleChange,
        clear
    };
}

