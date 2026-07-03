import React from "react";
import ReactECharts from "echarts-for-react";

interface ChartProps {
  type: string;
  data: any;
  title?: string;
  options?: any;
}

export const BIChart: React.FC<ChartProps> = ({ type, data, title, options }) => {
  const getOption = () => {
    const baseOption = {
      backgroundColor: "transparent",
      textStyle: { fontFamily: "Inter, sans-serif" }
    };

    let specificOption = {};
    switch (type) {
      case "KPI Card":
        specificOption = {
          title: {
            text: title || "KPI Value",
            left: "center",
            textStyle: { color: "#94a3b8", fontSize: 14 }
          },
          graphic: {
            type: "text",
            left: "center",
            top: "center",
            style: {
              text: data?.value || "0",
              textAlign: "center",
              fill: "#d4af37", // Gold Value Accent
              fontSize: 32,
              fontWeight: "bold"
            }
          }
        };
        break;

      case "Bar Chart":
        specificOption = {
          title: { text: title, textStyle: { color: "#f8fafc" } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: data?.labels || [], axisLabel: { color: "#94a3b8" } },
          yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
          series: [
            {
              data: data?.values || [],
              type: "bar",
              itemStyle: { color: "#d4af37" } // Royal Gold
            }
          ]
        };
        break;

      case "Line Chart":
        specificOption = {
          title: { text: title, textStyle: { color: "#f8fafc" } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: data?.labels || [], axisLabel: { color: "#94a3b8" } },
          yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
          series: [
            {
              data: data?.values || [],
              type: "line",
              smooth: true,
              itemStyle: { color: "#800020" } // Burgundy / Crimson
            }
          ]
        };
        break;

      case "Pie Chart":
      case "Donut Chart":
        specificOption = {
          title: { text: title, textStyle: { color: "#f8fafc" }, left: "center" },
          tooltip: { trigger: "item" },
          series: [
            {
              type: "pie",
              radius: type === "Donut Chart" ? ["40%", "70%"] : "70%",
              data: data?.pairs || [],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)"
                }
              }
            }
          ]
        };
        break;

      case "Heatmap":
      case "Correlation Matrix":
        specificOption = {
          title: { text: title || "Correlation Matrix", textStyle: { color: "#f8fafc" } },
          tooltip: { position: "top" },
          grid: { height: "70%", top: "15%" },
          xAxis: {
            type: "category",
            data: data?.cols || [],
            splitArea: { show: true },
            axisLabel: { color: "#94a3b8", interval: 0, rotate: 30 }
          },
          yAxis: {
            type: "category",
            data: data?.cols || [],
            splitArea: { show: true },
            axisLabel: { color: "#94a3b8" }
          },
          visualMap: {
            min: -1,
            max: 1,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: "0%",
            inRange: { color: ["#ef4444", "#ffffff", "#3b82f6"] }
          },
          series: [
            {
              name: "Correlation",
              type: "heatmap",
              data: data?.matrix || [],
              label: { show: true, formatter: (p: any) => p.value[2].toFixed(2) },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: "rgba(0, 0, 0, 0.5)"
                }
              }
            }
          ]
        };
        break;

      case "ROC Curve":
        specificOption = {
          title: { text: "ROC Curve", textStyle: { color: "#f8fafc" } },
          tooltip: { trigger: "axis" },
          xAxis: { name: "FPR", type: "value", min: 0, max: 1, axisLabel: { color: "#94a3b8" } },
          yAxis: { name: "TPR", type: "value", min: 0, max: 1, axisLabel: { color: "#94a3b8" } },
          series: [
            {
              data: data?.points || [],
              type: "line",
              showSymbol: false,
              itemStyle: { color: "#3b82f6" }
            },
            {
              data: [[0, 0], [1, 1]],
              type: "line",
              lineStyle: { type: "dashed" },
              showSymbol: false,
              itemStyle: { color: "#ef4444" }
            }
          ]
        };
        break;

      default:
        specificOption = {
          title: { text: `Unsupported chart: ${type}`, textStyle: { color: "#f8fafc" } }
        };
    }
    return { ...baseOption, ...specificOption };
  };

  return (
    <div className="w-full h-full p-2 bg-transparent rounded-xl border-none">
      <ReactECharts option={getOption()} style={{ width: "100%", height: "100%" }} theme="dark" />
    </div>
  );
};
