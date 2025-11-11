import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>This is your personal profile page.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>User profile information will be displayed here.</p>
      </CardContent>
    </Card>
  )
}
