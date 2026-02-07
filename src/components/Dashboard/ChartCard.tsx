
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Dashboard.css";

/**
 * ChartCard - Componente para mostrar diferentes tipos de gráficos
 */

const COLORS: Record<string, string> = {
  primary: "#419D78",
  secondary: "#4ade80",
  tertiary: "#E0A458",
  accent: "#667eea",
  danger: "#ef4444",
  warning: "#f59e0b",
};

const getColor = (colorKey?: string): string => COLORS[colorKey ?? "primary"] ?? COLORS.primary;

export interface DataKey {
  key: string;
  name: string;
  color?: string;
}

interface ChartCardProps {
  title: string;
  type?: "line" | "area" | "bar" | "pie";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKeys: DataKey[];
  height?: number;
}

const ChartCard = ({ title, type = "line", data, dataKeys, height = 300 }: ChartCardProps) => {
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.map((key) => (
                <Line
                  key={key.key}
                  type="monotone"
                  dataKey={key.key}
                  name={key.name}
                  stroke={getColor(key.color)}
                  strokeWidth={2}
                  dot={{ fill: getColor(key.color) }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.map((key) => (
                <Area
                  key={key.key}
                  type="monotone"
                  dataKey={key.key}
                  name={key.name}
                  stroke={getColor(key.color)}
                  fill={getColor(key.color)}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey={dataKeys[0]?.key || "name"}
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.slice(1).map((key) => (
                <Bar
                  key={key.key}
                  dataKey={key.key}
                  name={key.name}
                  fill={getColor(key.color)}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKeys[0]?.key || "value"}
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        {renderChart()}
      </div>
    </motion.div>
  );
};

export default ChartCard;
