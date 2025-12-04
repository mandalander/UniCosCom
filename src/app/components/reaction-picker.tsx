'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { REACTIONS, type ReactionType } from '@/lib/reactions';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
    onReact: (type: ReactionType) => void;
    currentReaction?: ReactionType | null;
    disabled?: boolean;
}

export function ReactionPicker({ onReact, currentReaction, disabled }: ReactionPickerProps) {
    const [open, setOpen] = useState(false);

    const handleReaction = (type: ReactionType) => {
        onReact(type);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-auto p-1.5 text-muted-foreground hover:text-primary transition-colors",
                        currentReaction && "text-primary"
                    )}
                    disabled={disabled}
                >
                    {currentReaction ? (
                        <span className="text-lg">{REACTIONS[currentReaction].emoji}</span>
                    ) : (
                        <Smile className="h-4 w-4" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1">
                    {(Object.entries(REACTIONS) as [ReactionType, typeof REACTIONS[ReactionType]][]).map(([type, { emoji, label }]) => (
                        <button
                            key={type}
                            onClick={() => handleReaction(type)}
                            className={cn(
                                "text-2xl p-2 rounded-lg transition-all duration-200 hover:scale-125 hover:bg-muted",
                                currentReaction === type && "bg-primary/10 scale-110"
                            )}
                            title={label}
                            aria-label={label}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
