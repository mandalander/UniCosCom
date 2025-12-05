'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 rounded-full border border-primary/20 backdrop-blur-sm">
                    <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                {title}
            </h3>

            <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
