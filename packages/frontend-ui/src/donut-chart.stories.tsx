import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cell, Label, Pie, PieChart } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";

const donutSegments = [
  { status: "published", count: 42, fill: "var(--color-published)" },
  { status: "draft", count: 18, fill: "var(--color-draft)" },
  { status: "review", count: 12, fill: "var(--color-review)" },
  { status: "blocked", count: 6, fill: "var(--color-blocked)" },
];

const chartConfig = {
  count: {
    label: "Packages",
  },
  published: {
    label: "Published",
    color: "var(--chart-1)",
  },
  draft: {
    label: "Draft",
    color: "var(--chart-2)",
  },
  review: {
    label: "In review",
    color: "var(--chart-3)",
  },
  blocked: {
    label: "Blocked",
    color: "var(--chart-4)",
  },
};

function DonutChart() {
  const totalPackages = donutSegments.reduce((total, segment) => total + segment.count, 0);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm">
        <ChartContainer
          aria-label="Package status donut chart"
          className="mx-auto aspect-square max-h-80"
          config={chartConfig}
          role="img"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="status" />}
            />
            <Pie
              data={donutSegments}
              dataKey="count"
              innerRadius={72}
              nameKey="status"
              outerRadius={104}
              paddingAngle={2}
              strokeWidth={4}
            >
              {donutSegments.map((segment) => (
                <Cell key={segment.status} fill={segment.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text
                      dominantBaseline="middle"
                      textAnchor="middle"
                      x={viewBox.cx}
                      y={viewBox.cy}
                    >
                      <tspan
                        className="fill-foreground text-3xl font-semibold"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        {totalPackages}
                      </tspan>
                      <tspan
                        className="fill-muted-foreground text-sm"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 24}
                      >
                        packages
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          {donutSegments.map((segment) => (
            <div key={segment.status} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.fill }}
              />
              <span className="capitalize text-muted-foreground">{segment.status}</span>
              <span className="ml-auto font-medium">{segment.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Storybook/Components/Donut Chart",
  component: DonutChart,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DonutChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
