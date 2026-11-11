"use client";

// Horizontal dot plot for MDX posts: one row per category, one dot per value, optional
// line linking a row's dots (dumbbell). Several panels share the same rows and legend
// and stack vertically. Props are plain data so MDX (a server component) can pass them.
import { useEffect, useRef, useState } from "react";
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

// "light" is the series color mixed toward the page background: the quieter of two related
// values (previous vs current, first vs second seed). "dark" is the plain series color.
type Shade = "light" | "dark";

const fillOf = (color: SeriesColor, shade: Shade = "dark") =>
  shade === "light"
    ? `color-mix(in oklab, ${seriesFill[color]} var(--chart-light-mix), hsl(var(--background)))`
    : seriesFill[color];

type Series = { key: string; label: string; color: SeriesColor; shade?: Shade };

type Point = {
  row: string;
  value: number;
  series: string;
  tip: string;
  label?: string;
  labelSide?: "left" | "right";
  // Overrides the series shade for this point.
  shade?: Shade;
};

type Panel = {
  title?: string;
  domain: [number, number];
  ticks: number[];
  scale?: "linear" | "log";
  unit?: string;
  // Written before each tick value, e.g. "$".
  prefix?: string;
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
  // Legend entries explaining what the light and dark shades mean, e.g. two seeds.
  shadeLegend?: { light: string; dark: string };
  caption?: string;
  labelWidth?: number;
};

const ROW_HEIGHT = 40;
// Narrow screens: the label column shrinks to this share of the chart width, and rows get
// taller so a label can wrap onto a third line.
const NARROW_LABEL_SHARE = 0.36;
const NARROW_ROW_HEIGHT = 52;

// The chart's own width, so the label column can give way on phones instead of the chart
// scrolling sideways. Null until measured (and on the server).
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// `compact`: the chart is squeezed (phones), so a left-side label goes above its dot instead,
// where it can't run into the row label.
type PlotPoint = Point & { fill: string; compact: boolean };

type ShapeProps = { cx?: number; cy?: number; payload?: PlotPoint };

function Dot({ cx, cy, payload }: ShapeProps) {
  if (cx === undefined || cy === undefined || !payload) return <g />;
  const side = payload.labelSide === "left" ? (payload.compact ? "above" : "left") : "right";
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} style={{ fill: payload.fill }} stroke="hsl(var(--background))" strokeWidth={2} />
      {payload.label ? (
        <text
          x={side === "right" ? cx + 12 : side === "left" ? cx - 12 : cx}
          y={side === "above" ? cy - 12 : cy}
          dy={side === "above" ? 0 : "0.35em"}
          textAnchor={side === "right" ? "start" : side === "left" ? "end" : "middle"}
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
  // Whole numbers get thousands separators: 4,225, not 4225.
  const text = panel.decimals === undefined ? value.toLocaleString("en-US") : value.toFixed(panel.decimals);
  const tick = `${panel.prefix ?? ""}${text}`;
  return panel.unit ? `${tick} ${panel.unit}` : tick;
}

function PanelChart({
  panel,
  rows,
  series,
  labelWidth,
  rowHeight,
}: {
  panel: Panel;
  rows: string[];
  series: Series[];
  labelWidth: number;
  rowHeight: number;
}) {
  const compact = rowHeight === NARROW_ROW_HEIGHT;
  const seriesOf = new Map(series.map((s) => [s.key, s]));
  const height = rows.length * rowHeight + 24 + (panel.reference ? 20 : 0) + (panel.axisLabel ? 24 : 0);

  return (
    <div>
      {panel.title ? <p className="my-0! text-sm font-semibold text-foreground">{panel.title}</p> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <ScatterChart margin={{ top: panel.reference ? 22 : 6, right: 56, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} syncWithTicks stroke="hsl(var(--border))" />
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
                      // Lifts the baseline off the svg edge so descenders are not clipped.
                      offset: 6,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }
                  : undefined
              }
              height={panel.axisLabel ? 48 : 24}
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
                .map((p) => {
                  const s = seriesOf.get(p.series);
                  return { ...p, fill: fillOf(s?.color ?? "neutral", p.shade ?? s?.shade), compact };
                });
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

export function DotPlot({
  title,
  rows,
  series,
  panels,
  legendNote,
  shadeLegend,
  caption,
  labelWidth = 120,
}: DotPlotProps) {
  // With one series the shades are that series' color; with several they are only a key, in gray.
  const shadeColor: SeriesColor = series.length === 1 ? series[0].color : "neutral";
  const [chartRef, chartWidth] = useWidth();
  const narrowLabelWidth = chartWidth === null ? labelWidth : Math.round(chartWidth * NARROW_LABEL_SHARE);
  const fittedLabelWidth = Math.min(labelWidth, narrowLabelWidth);
  const rowHeight = fittedLabelWidth < labelWidth ? NARROW_ROW_HEIGHT : ROW_HEIGHT;
  const swatch = (background: string) => <span className="inline-block size-2.5 rounded-full" style={{ background }} />;

  return (
    <ArtifactFrame label={title} meta={`${rows.length} rows`} caption={caption}>
      <figure className="not-prose font-sans" role="group" aria-label={title}>
        {series.length > 1 || legendNote || shadeLegend ? (
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {series.length > 1
              ? series.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5">
                    {swatch(fillOf(s.color, s.shade))}
                    {s.label}
                  </span>
                ))
              : null}
            {shadeLegend ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  {swatch(fillOf(shadeColor, "light"))}
                  {shadeLegend.light}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {swatch(fillOf(shadeColor))}
                  {shadeLegend.dark}
                </span>
              </>
            ) : null}
            {legendNote ? <span>{legendNote}</span> : null}
          </div>
        ) : null}
        <div ref={chartRef} className="space-y-4">
          {panels.map((panel, i) => (
            <PanelChart
              key={panel.title ?? i}
              panel={panel}
              rows={rows}
              series={series}
              labelWidth={fittedLabelWidth}
              rowHeight={rowHeight}
            />
          ))}
        </div>
      </figure>
    </ArtifactFrame>
  );
}
