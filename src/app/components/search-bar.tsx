'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useLanguage } from './language-provider';

export function SearchBar() {
    const [query, setQuery] = useState('');
    const router = useRouter();
    const { t } = useLanguage();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={t('searchPlaceholder') || "Search..."}
                className="w-full pl-9 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary glass"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    );
}
