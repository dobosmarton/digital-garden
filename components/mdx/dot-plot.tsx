"use client";

// Horizontal dot plot for MDX posts: one row per category, one dot per value, optional
// line linking a row's dots (dumbbell). Several panels share the same rows and legend
// and stack vertically. Props are plain data so MDX (a server component) can pass them.
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ArtifactFrame } from "@/components/ui/artifact-frame";

type SeriesColor = "primary" | "secondary" | "neutral";

const seriesFill: Record<SeriesColor, string> = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  neutral: "var(--chart-neutral)",
};

type Series = { key: string; label: string; color: SeriesColor };

type Point = {
  row: string;
  value: number;
  series: string;
  tip: string;
  label?: string;
  labelSide?: "left" | "right";
};

type Panel = {
  title?: string;
  domain: [number, number];
  ticks: number[];
  scale?: "linear" | "log";
  unit?: string;
  decimals?: number;
  axisLabel?: string;
  reference?: { value: number; label: string };
  connect?: boolean;
  points: Point[];
};

type DotPlotProps = {
  title: string;
  rows: string[];
  series: Series[];
  panels: Panel[];
  legendNote?: string;
  caption?: string;
  labelWidth?: number;
};

const ROW_HEIGHT = 40;

type PlotPoint = Point & { fill: string };

type ShapeProps = { cx?: number; cy?: number; payload?: PlotPoint };

function Dot({ cx, cy, payload }: ShapeProps) {
  if (cx === undefined || cy === undefined || !payload) return <g />;
  const side = payload.labelSide ?? "right";
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={payload.fill} stroke="hsl(var(--background))" strokeWidth={2} />
      {payload.label ? (
        <text
          x={side === "right" ? cx + 12 : cx - 12}
          y={cy}
          dy="0.35em"
          textAnchor={side === "right" ? "start" : "end"}
          fontSize={12}
          fill="hsl(var(--muted-foreground))"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {payload.label}
        </text>
      ) : null}
    </g>
  );
}

type TipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: PlotPoint }> };

function Tip({ active, payload }: TipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow">{point.tip}</div>;
}

function formatTick(value: number, panel: Panel) {
  const text = panel.decimals === undefined ? String(value) : value.toFixed(panel.decimals);
  return panel.unit ? `${text} ${panel.unit}` : text;
}

function PanelChart({
  panel,
  rows,
  series,
  labelWidth,
}: {
  panel: Panel;
  rows: string[];
  series: Series[];
  labelWidth: number;
}) {
  const colorOf = new Map(series.map((s) => [s.key, seriesFill[s.color]]));
  const height = rows.length * ROW_HEIGHT + 24 + (panel.reference ? 20 : 0) + (panel.axisLabel ? 20 : 0);

  return (
    <div>
      {panel.title ? <p className="my-0! text-sm font-semibold text-foreground">{panel.title}</p> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <ScatterChart margin={{ top: panel.reference ? 22 : 6, right: 56, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="value"
              scale={panel.scale ?? "linear"}
              domain={panel.domain}
              ticks={panel.ticks}
              tickFormatter={(v: number) => formatTick(v, panel)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={
                panel.axisLabel
                  ? {
                      value: panel.axisLabel,
                      position: "insideBottom",
                      offset: 0,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }
                  : undefined
              }
              height={panel.axisLabel ? 44 : 24}
            />
            <YAxis
              type="category"
              dataKey="row"
              allowDuplicatedCategory={false}
              reversed
              width={labelWidth}
              tick={{ fill: "hsl(var(--foreground))", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            {panel.reference ? (
              <ReferenceLine
                x={panel.reference.value}
                stroke="hsl(var(--muted-foreground))"
                label={{
                  value: panel.reference.label,
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />
            ) : null}
            <Tooltip content={<Tip />} cursor={false} isAnimationActive={false} />
            {rows.map((row) => {
              const data: PlotPoint[] = panel.points
                .filter((p) => p.row === row)
                .sort((a, b) => a.value - b.value)
                .map((p) => ({ ...p, fill: colorOf.get(p.series) ?? seriesFill.neutral }));
              return (
                <Scatter
                  key={row}
                  name={row}
                  data={data}
                  shape={Dot}
                  line={panel.connect ? { stroke: "var(--chart-link)", strokeWidth: 2 } : false}
                  isAnimationActive={false}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DotPlot({ title, rows, series, panels, legendNote, caption, labelWidth = 120 }: DotPlotProps) {
  return (
    <ArtifactFrame label={title} meta={`${rows.length} rows`} caption={caption}>
      <figure className="not-prose font-sans" role="group" aria-label={title}>
        {series.length > 1 || legendNote ? (
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {series.length > 1
              ? series.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: seriesFill[s.color] }} />
                    {s.label}
                  </span>
                ))
              : null}
            {legendNote ? <span>{legendNote}</span> : null}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <div className="space-y-4" style={{ minWidth: labelWidth + 260 }}>
            {panels.map((panel, i) => (
              <PanelChart key={panel.title ?? i} panel={panel} rows={rows} series={series} labelWidth={labelWidth} />
            ))}
          </div>
        </div>
      </figure>
    </ArtifactFrame>
  );
}
