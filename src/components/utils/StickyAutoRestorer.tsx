"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global component to handle "sticky" fields for uncontrolled components.
 * Listens for input events and persists values based on pathname and field name/id.
 */
export function StickyAutoRestorer() {
    const pathname = usePathname();

    useEffect(() => {
        // 1. Restore values on mount or pathname change
        const restoreFields = () => {
            const inputs = document.querySelectorAll('input:not([type="password"]):not([type="hidden"]), textarea, select');
            inputs.forEach((input: any) => {
                const key = input.name || input.id;
                if (!key || input.dataset.stickyIgnore === 'true') return;

                const storageKey = `sticky_restorer:${pathname}:${key}`;
                const savedValue = localStorage.getItem(storageKey);

                if (savedValue !== null) {
                    if (input.type === 'checkbox') {
                        input.checked = savedValue === 'true';
                    } else if (input.type === 'radio') {
                        input.checked = input.value === savedValue;
                    } else if (!input.value || input.dataset.stickyOverride === 'true') {
                        input.value = savedValue;
                        // Trigger events for React/Framework listeners
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        };

        // 2. Handle input events
        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const key = target.name || target.id;
            if (!key || target.dataset.stickyIgnore === 'true' || target.type === 'password') return;

            const storageKey = `sticky_restorer:${pathname}:${key}`;
            const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked.toString() : target.value;
            
            if (value && value !== 'false') {
                localStorage.setItem(storageKey, value);
            } else {
                localStorage.removeItem(storageKey);
            }
        };

        // 3. Clear logic via form submission or custom events
        const handleFormSubmit = (e: Event) => {
            const form = e.target as HTMLFormElement;
            // If form has data-sticky-clear-on-submit, we clear the fields
            if (form.dataset.stickyClear === 'true') {
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach((input: any) => {
                    const key = input.name || input.id;
                    if (key) {
                        localStorage.removeItem(`sticky_restorer:${pathname}:${key}`);
                    }
                });
            }
        };

        // Small delay to ensure React has finished initial render/hydration
        const timer = setTimeout(restoreFields, 800);

        document.addEventListener('input', handleInput);
        document.addEventListener('submit', handleFormSubmit);
        
        return () => {
            clearTimeout(timer);
            document.removeEventListener('input', handleInput);
            document.removeEventListener('submit', handleFormSubmit);
        };
    }, [pathname]);

    return null; // This is a behavior-only component
}
