import "@moritzbrantner/ui/styles.css";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

export function App() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Design system consumer</CardTitle>
          <CardDescription>
            This app imports the published package API and one global stylesheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Render shared UI</Button>
        </CardContent>
      </Card>
    </main>
  );
}
