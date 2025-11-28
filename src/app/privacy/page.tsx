'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/app/components/language-provider';

export default function PrivacyPolicyPage() {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center mb-4">
                        {t('privacyPolicyTitle') || "Polityka Prywatności"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Informacje Ogólne</h2>
                        <p>
                            Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników w związku z korzystaniem z serwisu UniCosCom.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Administrator Danych</h2>
                        <p>
                            Administratorem danych osobowych zawartych w serwisie jest UniCosCom. W sprawach związanych z ochroną danych osobowych prosimy o kontakt poprzez formularz kontaktowy lub adres e-mail administratora.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Zakres i Cel Zbierania Danych</h2>
                        <p>
                            Przetwarzamy dane osobowe niezbędne do świadczenia usług drogą elektroniczną, w tym:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Dane logowania (adres e-mail, identyfikator użytkownika) pozyskiwane poprzez Google Auth.</li>
                            <li>Dane profilowe (imię, nazwisko, zdjęcie profilowe) udostępnione dobrowolnie przez Użytkownika.</li>
                            <li>Treści publikowane w serwisie (posty, komentarze, głosy).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Pliki Cookies</h2>
                        <p>
                            Serwis wykorzystuje pliki cookies w celu zapewnienia poprawnego działania, zapamiętywania sesji użytkownika oraz w celach statystycznych. Użytkownik może w każdej chwili zmienić ustawienia dotyczące plików cookies w swojej przeglądarce.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Prawa Użytkownika</h2>
                        <p>
                            Użytkownik ma prawo do wglądu w swoje dane, ich edycji (poprzez ustawienia profilu) oraz żądania ich usunięcia (opcja "Usuń konto" w ustawieniach).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Zmiany Polityki Prywatności</h2>
                        <p>
                            Zastrzegamy sobie prawo do wprowadzania zmian w Polityce Prywatności. O wszelkich zmianach Użytkownicy zostaną poinformowani z odpowiednim wyprzedzeniem.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
