'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
    dataAdSlot: string;
    dataAdFormat?: 'auto' | 'fluid' | 'rectangle';
    dataFullWidthResponsive?: boolean;
    className?: string;
    compact?: boolean;
}

export function AdBanner({
    dataAdSlot,
    dataAdFormat = 'auto',
    dataFullWidthResponsive = true,
    className,
    compact = false,
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        if (adRef.current && adRef.current.getAttribute('data-ad-status') !== 'filled') {
            try {
                (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                (window as any).adsbygoogle.push({});
                if (adRef.current) {
                    adRef.current.setAttribute('data-ad-status', 'filled');
                }
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }
    }, []);

    return (
        <div className={`${compact ? 'my-1' : 'my-4'} overflow-hidden rounded-lg border bg-background/50 text-center shadow-sm w-full mx-auto max-w-[320px] sm:max-w-md md:max-w-2xl ${className}`}>
            {!compact && (
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground py-1 bg-muted/30">
                    Reklama
                </div>
            )}
            <ins
                className="adsbygoogle block"
                style={{ display: 'block', minHeight: compact ? '32px' : undefined, maxHeight: compact ? '32px' : undefined }}
                data-ad-client="ca-pub-7558071569357753"
                data-ad-slot={dataAdSlot}
                data-ad-format={dataAdFormat}
                data-full-width-responsive={dataFullWidthResponsive ? 'true' : 'false'}
                ref={adRef}
            />
        </div>
    );
}
