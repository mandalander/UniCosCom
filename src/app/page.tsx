'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./components/language-provider";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('homeTitle')}</CardTitle>
          <CardDescription>
            {t('homeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            {t('homeContent1')}
          </p>
          <p className="mt-4">
            {t('homeContent2')}
          </p>
          <p className="mt-4">
            {t('homeContent3')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
