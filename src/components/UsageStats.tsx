import { useEffect, useMemo, useState } from "react";
import { Button, Card, Segmented, Skeleton, Statistic, Table, Tag, Tooltip, Typography, message } from "antd";
import { ApiOutlined, DollarOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Text, Title } = Typography;
type Range = "today" | "7d" | "30d";

const number = new Intl.NumberFormat("en-US");
const money = (value: number) => `$${value.toFixed(4)}`;

function TrendChart({ data, language }: { data: CodexUsageStatistics["points"]; language: "zh" | "en" }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 1000, height = 286, left = 62, top = 20, right = 24, bottom = 38;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const metrics = [
    { key: "tokens" as const, color: "#1677ff", label: "Tokens" },
    { key: "requests" as const, color: "#13c2c2", label: "Requests" },
    { key: "cost" as const, color: "#fa8c16", label: "Cost" },
  ];
  const maxima = Object.fromEntries(metrics.map(({ key }) => [key, Math.max(1, ...data.map((item) => item[key]))])) as Record<"tokens" | "requests" | "cost", number>;
  const pointFor = (key: "tokens" | "requests" | "cost", index: number) => ({
    x: left + (index * plotWidth) / Math.max(1, data.length - 1),
    y: top + (1 - data[index][key] / maxima[key]) * plotHeight,
  });
  const pathFor = (key: "tokens" | "requests" | "cost") => {
    const points = data.map((_, index) => pointFor(key, index));
    if (points.length < 2) return points.length ? `M${points[0].x},${points[0].y}` : "";
    return points.slice(1).reduce((path, point, index) => {
      const previous = points[index];
      const controlX = (previous.x + point.x) / 2;
      return `${path} C${controlX.toFixed(1)},${previous.y.toFixed(1)} ${controlX.toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }, `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`);
  };
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const active = hovered == null ? null : data[hovered];
  const hoverX = hovered == null ? 0 : pointFor("tokens", hovered).x;
  return (
    <div className="usage-chart-wrap" onMouseLeave={() => setHovered(null)}>
      <div className="usage-chart-legend">{metrics.map((metric) => <span key={metric.key}><i style={{ background: metric.color }} />{metric.label}</span>)}</div>
      {active && <div className="usage-chart-tooltip" style={{ left: `${(hoverX / width) * 100}%` }}><strong>{active.label}</strong><span>{language === "zh" ? "Token" : "Tokens"}：{number.format(active.tokens)}</span><span>{language === "zh" ? "请求数" : "Requests"}：{number.format(active.requests)}</span><span>{language === "zh" ? "成本" : "Cost"}：{money(active.cost)}</span></div>}
      <svg className="usage-chart" viewBox={`0 0 ${width} ${height}`} role="img" onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * width;
        setHovered(Math.max(0, Math.min(data.length - 1, Math.round(((x - left) / plotWidth) * Math.max(1, data.length - 1)))));
      }}>
        {[0, 1, 2, 3, 4].map((line) => { const y = top + line * (plotHeight / 4); return <g key={line}><line x1={left} x2={width - right} y1={y} y2={y} className="chart-grid" /><text x={left - 12} y={y + 4} textAnchor="end" className="chart-axis-label">{100 - line * 25}%</text></g>; })}
        <text x="14" y={top + plotHeight / 2} textAnchor="middle" className="chart-axis-title" transform={`rotate(-90 14 ${top + plotHeight / 2})`}>{language === "zh" ? "相对峰值" : "Relative peak"}</text>
        {metrics.map((metric) => <path key={metric.key} d={pathFor(metric.key)} fill="none" stroke={metric.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
        {hovered != null && <><line x1={hoverX} x2={hoverX} y1={top} y2={top + plotHeight} className="chart-hover-line" />{metrics.map((metric) => { const point = pointFor(metric.key, hovered); return <circle key={metric.key} cx={point.x} cy={point.y} r="5" fill="#fff" stroke={metric.color} strokeWidth="3" />; })}</>}
        {data.map((item, index) => index % labelStep === 0 || index === data.length - 1 ? <text key={item.label} x={left + (index * plotWidth) / Math.max(1, data.length - 1)} y={height - 9} textAnchor="middle">{item.label}</text> : null)}
      </svg>
    </div>
  );
}

export default function UsageStats({ language }: { language: "zh" | "en" }) {
  const zh = language === "zh";
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState<CodexUsageStatistics>();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setLogPage(1);
    setLoading(true);
    window.codexAPI.getUsageStatistics(range).then(setData).catch((error: Error) => messageApi.error(error.message)).finally(() => setLoading(false));
  }, [range, refreshKey, messageApi]);

  const modelColumns: ColumnsType<CodexUsageStatistics["models"][number]> = useMemo(() => [
    { title: zh ? "模型" : "Model", dataIndex: "model" },
    { title: zh ? "请求数" : "Requests", dataIndex: "requests", align: "right", render: (value) => <span className="usage-value requests">{number.format(value)}</span> },
    { title: "Tokens", dataIndex: "tokens", align: "right", render: (value) => <span className="usage-value tokens">{number.format(value)}</span> },
    { title: zh ? "总成本" : "Cost", dataIndex: "cost", align: "right", render: (value) => <span className="usage-value cost">{money(value)}</span> },
  ], [zh]);
  const logColumns: ColumnsType<CodexUsageStatistics["logs"][number]> = useMemo(() => [
    { title: zh ? "时间" : "Time", dataIndex: "timestamp", width: 158, render: (value) => new Date(value).toLocaleString() },
    { title: zh ? "计费模型" : "Model", dataIndex: "model", width: 150, render: (value) => <Text className="usage-model-name" ellipsis={{ tooltip: value }}>{value}</Text> },
    { title: zh ? "输入" : "Input", dataIndex: "inputTokens", width: 96, align: "right", render: (value, row) => <><div className="usage-value tokens">{number.format(Math.max(0, value - row.cacheReadTokens))}</div>{row.cacheReadTokens > 0 && <Text type="secondary" className="usage-cache-tokens">R {number.format(row.cacheReadTokens)}</Text>}</> },
    { title: zh ? "输出" : "Output", dataIndex: "outputTokens", width: 84, align: "right", render: (value) => <span className="usage-value tokens">{number.format(value)}</span> },
    { title: zh ? "总成本" : "Cost", dataIndex: "cost", width: 104, align: "right", render: (value, row) => row.priced ? <span className="usage-value cost">{money(value)}</span> : <Text type="secondary">-</Text> },
    { title: zh ? "状态" : "Status", dataIndex: "status", width: 72, align: "center", render: (value) => value == null ? "-" : <Tag color={value >= 200 && value < 300 ? "success" : "error"}>{value}</Tag> },
  ], [zh]);

  return (
    <div className="usage-page">
      {contextHolder}
      <div className="usage-toolbar"><div><Title level={3}>{zh ? "用量统计" : "Usage statistics"}</Title><Text type="secondary">{zh ? "查看 AI 模型的使用情况和成本统计" : "View AI model usage and cost statistics"}</Text></div><div className="usage-range-actions"><Tooltip title={zh ? "刷新统计" : "Refresh statistics"}><Button icon={<ReloadOutlined />} loading={loading} onClick={() => setRefreshKey((value) => value + 1)} aria-label={zh ? "刷新统计" : "Refresh statistics"} /></Tooltip><Segmented value={range} onChange={(value) => setRange(value as Range)} options={[{ label: zh ? "当天" : "Today", value: "today" }, { label: zh ? "7 天" : "7 days", value: "7d" }, { label: zh ? "1 个月" : "1 month", value: "30d" }]} /></div></div>
      {loading || !data ? <Skeleton active paragraph={{ rows: 16 }} /> : <>
        <div className="usage-summary-grid">
          <Card className="usage-summary-card tokens"><div className="usage-summary-icon"><ThunderboltOutlined /></div><Statistic title={zh ? "总 Token 消耗" : "Total tokens"} value={data.summary.tokens} formatter={(value) => number.format(Number(value))} /></Card>
          <Card className="usage-summary-card requests"><div className="usage-summary-icon"><ApiOutlined /></div><Statistic title={zh ? "总请求数" : "Total requests"} value={data.summary.requests} /></Card>
          <Card className="usage-summary-card cost"><div className="usage-summary-icon"><DollarOutlined /></div><Statistic title={zh ? "总成本金额（估算）" : "Estimated cost"} value={data.summary.cost} precision={4} prefix="$" /></Card>
        </div>
        {data.summary.unpricedRequests > 0 && <Text className="usage-cost-note" type="secondary">{zh ? `有 ${data.summary.unpricedRequests} 条未知模型请求无法匹配单价，成本按 $0 计。` : `${data.summary.unpricedRequests} requests use models without known pricing and count as $0.`}</Text>}
        <Text className="usage-cost-note" type="secondary">{zh ? "产生计费 Token 的会话记录状态记为 200。" : "Session records with billable tokens use status 200."}</Text>
        <Card className="usage-section"><Title level={4}>{zh ? "趋势概览" : "Trends"}</Title><TrendChart data={data.points} language={language} /></Card>
        <Card className="usage-section"><Title level={4}>{zh ? "模型统计" : "Model statistics"}</Title><Table rowKey="model" size="middle" pagination={false} columns={modelColumns} dataSource={data.models} /></Card>
        <Card className="usage-section"><Title level={4}>{zh ? "请求日志" : "Request logs"}</Title><Table rowKey="id" size="middle" tableLayout="fixed" pagination={{ current: logPage, pageSize: logPageSize, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total) => zh ? `共 ${total} 条` : `${total} items`, onChange: (page, pageSize) => { setLogPage(pageSize === logPageSize ? page : 1); setLogPageSize(pageSize); } }} columns={logColumns} dataSource={data.logs} /></Card>
      </>}
    </div>
  );
}
