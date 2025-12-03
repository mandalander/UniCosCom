'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
    dataAdSlot: string;
    dataAdFormat?: 'auto' | 'fluid' | 'rectangle';
    dataFullWidthResponsive?: boolean;
    className?: string;
}

export function AdBanner({
    dataAdSlot,
    dataAdFormat = 'auto',
    dataFullWidthResponsive = true,
    className,
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            // Check if the ad has already been loaded in this slot to prevent duplicate calls
            if (adRef.current && adRef.current.innerHTML === '') {
                (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                (window as any).adsbygoogle.push({});
            }
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`my-4 overflow-hidden rounded-lg border bg-background/50 text-center shadow-sm w-full mx-auto max-w-[320px] sm:max-w-md md:max-w-2xl ${className}`}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground py-1 bg-muted/30">
                Reklama
            </div>
            <ins
                className="adsbygoogle block"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7558071569357753"
                data-ad-slot={dataAdSlot}
                data-ad-format={dataAdFormat}
                data-full-width-responsive={dataFullWidthResponsive ? 'true' : 'false'}
                ref={adRef}
            />
        </div>
    );
}
