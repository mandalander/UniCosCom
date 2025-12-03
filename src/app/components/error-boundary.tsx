'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                                <CardTitle>Coś poszło nie tak</CardTitle>
                            </div>
                            <CardDescription>
                                Przepraszamy, wystąpił nieoczekiwany błąd.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {this.state.error && (
                                <div className="bg-muted p-3 rounded text-sm font-mono overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={this.handleReset} className="w-full">
                                Odśwież stronę
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
