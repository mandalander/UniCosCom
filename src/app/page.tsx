import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Witaj w Nawigatorze Aplikacji</CardTitle>
          <CardDescription>
            To jest przykładowa aplikacja demonstrująca responsywny układ z górnym paskiem nawigacyjnym i zwijanym paskiem bocznym.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Użyj ikony menu w lewym górnym rogu, aby otworzyć i zamknąć pasek boczny. Pasek boczny zawiera linki nawigacyjne do różnych sekcji aplikacji.
          </p>
          <p className="mt-4">
            Przycisk logowania w prawym górnym rogu zazwyczaj prowadzi do strony uwierzytelniania.
          </p>
          <p className="mt-4">
            Ten interfejs został zbudowany przy użyciu Next.js, TypeScript, Tailwind CSS i komponentów ShadCN UI, aby był nowoczesny, responsywny i dostępny.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
