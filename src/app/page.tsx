import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to App Navigator</CardTitle>
          <CardDescription>
            This is a sample application demonstrating a responsive layout with a top navigation bar and a collapsible sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Use the menu icon in the top-left corner to open and close the sidebar. The sidebar provides navigation links to different sections of the application.
          </p>
          <p className="mt-4">
            The login button in the top-right corner would typically lead to an authentication page.
          </p>
          <p className="mt-4">
            This interface is built with Next.js, TypeScript, Tailwind CSS, and ShadCN UI components, designed to be modern, responsive, and accessible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
