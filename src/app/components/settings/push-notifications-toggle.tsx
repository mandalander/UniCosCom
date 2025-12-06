'use client';

import { useFcm } from '@/hooks/use-fcm';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/app/components/language-provider';

export function PushNotificationsToggle() {
    const { permission, requestPermission, isLoading } = useFcm();
    const { t } = useLanguage();

    const renderButton = () => {
        if (isLoading) {
            return (
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Włączanie...
                </Button>
            );
        }

        if (permission === 'granted') {
            return (
                <Button variant="outline" className="text-green-600 border-green-200 cursor-default hover:bg-green-50">
                    <Bell className="mr-2 h-4 w-4" />
                    Powiadomienia aktywne
                </Button>
            );
        }

        if (permission === 'denied') {
            return (
                <Button variant="destructive" disabled>
                    <BellOff className="mr-2 h-4 w-4" />
                    Powiadomienia zablokowane
                </Button>
            );
        }

        return (
            <Button onClick={requestPermission}>
                <Bell className="mr-2 h-4 w-4" />
                Włącz powiadomienia
            </Button>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Powiadomienia Push</CardTitle>
                <CardDescription>
                    Otrzymuj powiadomienia o nowych reakcjach, głosach i komentarzach bezpośrednio w przeglądarce.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Status powiadomień</p>
                        <p className="text-xs text-muted-foreground">
                            {permission === 'granted'
                                ? 'Powiadomienia są włączone dla tego urządzenia.'
                                : permission === 'denied'
                                    ? 'Zablokowałeś powiadomienia w tej przeglądarce.'
                                    : 'Nie włączyłeś jeszcze powiadomień.'}
                        </p>
                    </div>
                    {renderButton()}
                </div>
            </CardContent>
        </Card>
    );
}
