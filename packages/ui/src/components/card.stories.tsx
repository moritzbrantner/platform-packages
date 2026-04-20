import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontalIcon } from "lucide-react";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Inference queue</CardTitle>
        <CardDescription>Current batch status across workers.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Running</span>
            <Badge>18 jobs</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Waiting</span>
            <Badge variant="secondary">7 jobs</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">Updated just now</span>
        <Button size="sm">Open queue</Button>
      </CardFooter>
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card size="sm" className="w-[320px]">
      <CardHeader>
        <CardTitle>Model health</CardTitle>
        <CardDescription>Latency and availability summary.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold">99.8%</span>
          <span className="pb-1 text-sm text-muted-foreground">available</span>
        </div>
      </CardContent>
    </Card>
  ),
};
