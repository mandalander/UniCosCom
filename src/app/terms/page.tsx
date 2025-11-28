'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/app/components/language-provider';

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center mb-4">
                        {t('termsTitle') || "Regulamin Serwisu"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Postanowienia Ogólne</h2>
                        <p>
                            Niniejszy Regulamin określa zasady korzystania z serwisu społecznościowego UniCosCom. Rejestracja i korzystanie z serwisu oznacza akceptację niniejszego Regulaminu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Zasady Korzystania</h2>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Użytkownik zobowiązuje się do korzystania z serwisu w sposób zgodny z prawem i dobrymi obyczajami.</li>
                            <li>Zabronione jest publikowanie treści obraźliwych, wulgarnych, nawołujących do nienawiści lub naruszających prawa autorskie.</li>
                            <li>Użytkownik ponosi pełną odpowiedzialność za treści publikowane na swoim koncie.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Konto Użytkownika</h2>
                        <p>
                            Dostęp do pełnych funkcjonalności serwisu wymaga założenia konta. Użytkownik jest odpowiedzialny za zachowanie poufności swoich danych dostępowych.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Odpowiedzialność</h2>
                        <p>
                            Administrator dokłada wszelkich starań, aby serwis działał poprawnie, jednak nie gwarantuje jego bezawaryjności. Administrator nie ponosi odpowiedzialności za szkody wynikłe z korzystania z serwisu, chyba że wynikają one z winy umyślnej.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Moderacja Treści</h2>
                        <p>
                            Administrator zastrzega sobie prawo do usuwania treści naruszających Regulamin oraz do blokowania kont Użytkowników, którzy uporczywie łamią zasady serwisu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Postanowienia Końcowe</h2>
                        <p>
                            W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie przepisy prawa polskiego. Administrator zastrzega sobie prawo do zmiany Regulaminu.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
