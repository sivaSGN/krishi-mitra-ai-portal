import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const monthly = [
  { m: "Apr", searches: 38 },
  { m: "May", searches: 52 },
  { m: "Jun", searches: 49 },
  { m: "Jul", searches: 71 },
  { m: "Aug", searches: 62 },
  { m: "Sep", searches: 86 },
];
const categories = [
  { name: "Financial", value: 34, fill: "var(--color-primary)" },
  { name: "Insurance", value: 24, fill: "var(--color-info)" },
  { name: "Equipment", value: 22, fill: "var(--color-warning)" },
  { name: "Other", value: 20, fill: "var(--color-muted-foreground)" },
];
const eligibility = [
  { name: "Eligible", value: 5, fill: "var(--color-success)" },
  { name: "Potential", value: 3, fill: "var(--color-warning)" },
  { name: "Review", value: 2, fill: "var(--color-info)" },
];
const saved = [
  { m: "Apr", schemes: 1 },
  { m: "May", schemes: 2 },
  { m: "Jun", schemes: 2 },
  { m: "Jul", schemes: 4 },
  { m: "Aug", schemes: 5 },
  { m: "Sep", schemes: 6 },
];
export function SearchChart() {
  return (
    <ChartContainer
      config={{ searches: { label: "Searches", color: "var(--color-primary)" } }}
      className="h-64 w-full"
    >
      <BarChart data={monthly}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="searches" fill="var(--color-searches)" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
export function CategoryChart() {
  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={{ value: { label: "Schemes" } }} className="h-52 w-52 shrink-0">
        <PieChart>
          <Pie
            data={categories}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={3}
          >
            {categories.map((x) => (
              <Cell key={x.name} fill={x.fill} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        </PieChart>
      </ChartContainer>
      <div className="space-y-3">
        {categories.map((x) => (
          <div key={x.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ background: x.fill }} />
            <span className="text-muted-foreground">{x.name}</span>
            <b>{x.value}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function EligibilityChart() {
  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={{ value: { label: "Schemes" } }} className="h-52 w-52 shrink-0">
        <PieChart>
          <Pie
            data={eligibility}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={3}
          >
            {eligibility.map((x) => (
              <Cell key={x.name} fill={x.fill} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        </PieChart>
      </ChartContainer>
      <div className="space-y-3">
        {eligibility.map((x) => (
          <div key={x.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ background: x.fill }} />
            <span className="text-muted-foreground">{x.name}</span>
            <b>{x.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function SavedChart() {
  return (
    <ChartContainer
      config={{ schemes: { label: "Saved", color: "var(--color-info)" } }}
      className="h-52 w-full"
    >
      <BarChart data={saved} layout="vertical">
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis dataKey="m" type="category" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="schemes" fill="var(--color-schemes)" radius={[0, 5, 5, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
