'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-10 w-10">
                <Sun className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 transition-all hover:rotate-180 duration-300"
            title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all" />
            ) : (
                <Moon className="h-5 w-5 rotate-0 scale-100 transition-all" />
            )}
        </Button>
    );
}
