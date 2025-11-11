import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mój profil</CardTitle>
        <CardDescription>To jest Twoja osobista strona profilowa.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Informacje o profilu użytkownika zostaną wyświetlone tutaj.</p>
      </CardContent>
    </Card>
  )
}
