'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustawienia</CardTitle>
        <CardDescription>
          Zarządzaj ustawieniami konta i aplikacji.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Motyw</Label>
          <Select onValueChange={setTheme} defaultValue="system">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz motyw" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Jasny</SelectItem>
              <SelectItem value="dark">Ciemny</SelectItem>
              <SelectItem value="system">Systemowy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="language">Język</Label>
          <Select defaultValue="pl">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz język" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">Angielski</SelectItem>
              <SelectItem value="pl">Polski</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
