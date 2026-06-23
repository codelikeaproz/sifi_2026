import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { AdminShell } from "@/components/AdminShell";
import { RegionFilter } from "@/components/RegionFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getScholarAnalytics,
  type RegionFilterValue,
  type ScholarAnalytics,
} from "@/lib/api";

const REGION_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
];

const yearChartConfig = {
  count: {
    label: "Graduates",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-semibold tabular-nums text-primary">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { assignedRegion } = useAuth();
  const { error: showError } = useToast();

  const [region, setRegion] = useState<RegionFilterValue>(
    assignedRegion ?? "all"
  );
  const [analytics, setAnalytics] = useState<ScholarAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignedRegion) {
      setRegion(assignedRegion);
    }
  }, [assignedRegion]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScholarAnalytics(
        region !== "all" ? { region } : undefined
      );
      setAnalytics(data);
    } catch (err) {
      showError(
        "Failed to load analytics",
        err instanceof Error ? err.message : "Request failed"
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [region, showError]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const regionChartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: { label: "Graduates" },
    };
    analytics?.byRegion.forEach((item, index) => {
      config[item.region] = {
        label: item.regionLabel,
        color: REGION_CHART_COLORS[index % REGION_CHART_COLORS.length],
      };
    });
    return config;
  }, [analytics?.byRegion]);

  const regionsWithData = useMemo(
    () => analytics?.byRegion.filter((item) => item.count > 0) ?? [],
    [analytics?.byRegion]
  );

  const showRegionPie =
    !assignedRegion &&
    region === "all" &&
    regionsWithData.length > 1;

  const missingClassYear = analytics
    ? analytics.total - analytics.withYearSet
    : 0;

  return (
    <AdminShell
      title="Analytics"
      description="Graduate totals by region and graduation year."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {assignedRegion ? (
            <p className="text-sm font-medium">{analytics?.scope.regionLabel}</p>
          ) : (
            <RegionFilter
              value={region}
              onChange={setRegion}
              lockedRegion={assignedRegion ?? undefined}
            />
          )}
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading analytics…"
              : analytics
                ? `${analytics.scope.regionLabel} · ${analytics.total} graduate${analytics.total === 1 ? "" : "s"}`
                : "No data available"}
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !analytics || analytics.total === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No scholars in this scope yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                missingClassYear > 0
                  ? "grid gap-4 sm:grid-cols-2"
                  : "max-w-sm"
              }
            >
              <StatCard
                label="Total graduates"
                value={analytics.total}
                hint={
                  missingClassYear === 0
                    ? "All profiles include a class year."
                    : undefined
                }
              />
              {missingClassYear > 0 && (
                <StatCard
                  label="Missing class year"
                  value={missingClassYear}
                  hint="Edit these scholar profiles to add a class year."
                />
              )}
            </div>

            <div
              className={
                showRegionPie
                  ? "grid gap-6 lg:grid-cols-2"
                  : "grid gap-6"
              }
            >
              {showRegionPie && (
                <Card>
                  <CardHeader>
                    <CardTitle>Graduates by region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={regionChartConfig}
                      className="mx-auto aspect-square max-h-[320px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              nameKey="regionLabel"
                              hideLabel
                            />
                          }
                        />
                        <Pie
                          data={regionsWithData}
                          dataKey="count"
                          nameKey="regionLabel"
                          innerRadius={60}
                          strokeWidth={2}
                        >
                          {regionsWithData.map((entry, index) => (
                            <Cell
                              key={entry.region}
                              fill={
                                REGION_CHART_COLORS[
                                  index % REGION_CHART_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              <Card className={showRegionPie ? undefined : "lg:col-span-2"}>
                <CardHeader>
                  <CardTitle>Graduates by class year</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.byYear.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No graduation year data yet.
                    </p>
                  ) : (
                    <ChartContainer config={yearChartConfig} className="h-[320px] w-full">
                      <BarChart data={analytics.byYear} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="yearLabel"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={32}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--color-count)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
