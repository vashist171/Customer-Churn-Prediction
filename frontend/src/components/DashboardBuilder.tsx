import React, { useState } from "react";
import { BIChart } from "./Charts";
import { Plus, Trash, Settings, Filter, Bookmark } from "lucide-react";

interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  metric?: string;
  measureCol?: string;
}

export const DashboardBuilder: React.FC<{ datasetData: any; columns: any[]; theme: "light" | "dark" }> = ({ datasetData, columns, theme }) => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "1", type: "KPI Card", title: "Total Customers", x: 0, y: 0, w: 3, h: 2, metric: "total_customers" },
    { id: "2", type: "Bar Chart", title: "Churn by Category", x: 3, y: 0, w: 6, h: 4 },
    { id: "3", type: "Donut Chart", title: "Loyal vs Risk Distribution", x: 9, y: 0, w: 3, h: 4 }
  ]);

  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
  // Power BI Features State
  const [slicerFilter, setSlicerFilter] = useState<string>("");
  const [drillDownLevel, setDrillDownLevel] = useState<string>("Category");
  const [bookmarks, setBookmarks] = useState<Array<{ name: string; widgets: Widget[] }>>([]);
  const [bookmarkName, setBookmarkName] = useState<string>("");

  const addWidget = (type: string) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: `${type}`,
      x: 0,
      y: 0,
      w: type.includes("Card") ? 3 : 6,
      h: type.includes("Card") ? 2 : 4
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const saveBookmark = () => {
    if (!bookmarkName.trim()) return;
    setBookmarks([...bookmarks, { name: bookmarkName, widgets: JSON.parse(JSON.stringify(widgets)) }]);
    setBookmarkName("");
  };

  const applyBookmark = (b: { name: string; widgets: Widget[] }) => {
    setWidgets(b.widgets);
  };

  const totalRows = datasetData ? datasetData.length : 0;
  
  // Custom calculated measure simulation
  const numericCols = columns.filter((c) => c.detected_type === "numeric").map((c) => c.name);

  // Styling maps
  const isDark = theme === "dark";
  const bgCanvas = isDark ? "bg-radial-[at_top_right] from-[#1a122e] via-[#08070d] to-[#040406]" : "bg-[#fcfcff]";
  const borderCanvas = isDark ? "border-[#d4af37]/20" : "border-slate-200";
  const bgPanel = isDark ? "bg-[#14121f]/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-md";
  const textTitle = isDark ? "text-[#d4af37] font-semibold tracking-widest uppercase" : "text-slate-900 font-semibold uppercase";
  const textLabel = isDark ? "text-slate-400 font-medium" : "text-slate-600 font-medium";
  const bgWidget = isDark ? "bg-[#1c182a]/70 border-2 border-double border-[#d4af37]/20 hover:border-[#d4af37]/65 shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:shadow-[0_0_25px_rgba(212,175,55,0.15)]" : "bg-white/80 border-2 border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md";

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Power BI Slicers & Toolbars */}
      <div className={`flex flex-wrap items-center justify-between p-4 ${bgPanel} border ${borderCanvas} rounded-2xl gap-4 shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className={textLabel} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${textLabel}`}>Global Slicer:</span>
            <select
              value={slicerFilter}
              onChange={(e) => setSlicerFilter(e.target.value)}
              className={`text-xs rounded-lg px-2.5 py-1.5 ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-white text-slate-800 border-slate-300"} border focus:outline-none`}
            >
              <option value="">All Customers</option>
              <option value="high-churn">High Churn Risk (&gt;50%)</option>
              <option value="low-tenure">Low Tenure (&lt;12 months)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textLabel}`}>Drill-down:</span>
            <button
              onClick={() => setDrillDownLevel(drillDownLevel === "Category" ? "Individual" : "Category")}
              className={`px-3 py-1 text-xs rounded-lg border ${isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700"} hover:bg-blue-600/10`}
            >
              Level: {drillDownLevel}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme action preview */}
          <button
            onClick={() => addWidget("KPI Card")}
            className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> KPI
          </button>
          <button
            onClick={() => addWidget("Bar Chart")}
            className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> Bar
          </button>
          <button
            onClick={() => addWidget("Donut Chart")}
            className="px-3.5 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> Donut
          </button>
        </div>
      </div>

      {/* Bookmarks Section */}
      <div className={`p-4 ${bgPanel} border ${borderCanvas} rounded-2xl flex items-center justify-between gap-4 shadow-sm`}>
        <div className="flex items-center gap-2">
          <Bookmark size={16} className={textLabel} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${textLabel}`}>Bookmarks & Snapshots:</span>
          <div className="flex gap-1.5">
            {bookmarks.map((b, idx) => (
              <button
                key={idx}
                onClick={() => applyBookmark(b)}
                className={`px-2.5 py-1 text-xs rounded border ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-white text-slate-700 border-slate-300"} hover:bg-blue-500/10`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Bookmark Name"
            value={bookmarkName}
            onChange={(e) => setBookmarkName(e.target.value)}
            className={`text-xs rounded px-2.5 py-1 ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-white text-slate-800 border-slate-300"} border focus:outline-none`}
          />
          <button
            onClick={saveBookmark}
            className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded font-medium"
          >
            Save View
          </button>
        </div>
      </div>

      {/* Canvas workspace layout */}
      <div className="flex gap-4 flex-1 overflow-hidden min-h-[500px]">
        <div className={`flex-1 grid grid-cols-12 gap-4 auto-rows-[90px] overflow-y-auto p-6 ${bgCanvas} border ${borderCanvas} rounded-2xl relative shadow-inner`}>
          {widgets.map((widget) => {
            let chartData: any = {};
            if (widget.type === "KPI Card") {
              chartData = { value: slicerFilter ? Math.floor(totalRows * 0.23).toString() : totalRows.toString() };
            } else if (widget.type === "Bar Chart") {
              chartData = {
                labels: drillDownLevel === "Category" ? ["Tenure Low", "Tenure High", "Mid charges", "Senior"] : ["ID 100", "ID 101", "ID 102", "ID 103", "ID 104"],
                values: drillDownLevel === "Category" ? [1200, 850, 600, 420] : [92, 85, 41, 10, 88]
              };
            } else {
              chartData = {
                pairs: [
                  { name: "Active", value: 75.8 },
                  { name: "Churn Risk", value: 24.2 }
                ]
              };
            }

            return (
              <div
                key={widget.id}
                style={{
                  gridColumn: `span ${widget.w}`,
                  gridRow: `span ${widget.h}`
                }}
                className={`relative group p-1.5 ${bgWidget} rounded-2xl border ${
                  selectedWidget?.id === widget.id ? "border-blue-500 shadow-md" : isDark ? "border-slate-800" : "border-slate-200"
                } overflow-hidden transition-all duration-200`}
                onClick={() => setSelectedWidget(widget)}
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWidget(widget.id);
                    }}
                    className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition"
                  >
                    <Trash size={12} />
                  </button>
                </div>
                <div className="w-full h-full">
                  <BIChart type={widget.type} data={chartData} title={widget.title} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Builder Sidebar options */}
        {selectedWidget && (
          <div className={`w-80 p-5 ${bgPanel} border ${borderCanvas} rounded-2xl flex flex-col gap-4 shadow-lg`}>
            <h3 className={`font-bold text-sm flex items-center gap-1.5 ${textTitle}`}>
              <Settings size={16} /> Properties Builder
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${textLabel}`}>Widget Title</label>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) => {
                  const updated = widgets.map((w) =>
                    w.id === selectedWidget.id ? { ...w, title: e.target.value } : w
                  );
                  setWidgets(updated);
                  setSelectedWidget({ ...selectedWidget, title: e.target.value });
                }}
                className={`p-2 rounded text-xs focus:outline-none ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"} border`}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${textLabel}`}>Calculated Column Measure</label>
              <select
                value={selectedWidget.measureCol || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = widgets.map((w) =>
                    w.id === selectedWidget.id ? { ...w, measureCol: val } : w
                  );
                  setWidgets(updated);
                  setSelectedWidget({ ...selectedWidget, measureCol: val });
                }}
                className={`p-2 rounded text-xs focus:outline-none ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"} border`}
              >
                <option value="">None (Count Aggregation)</option>
                {numericCols.map((c) => (
                  <option key={c} value={c}>Sum of {c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${textLabel}`}>Grid Width</label>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={selectedWidget.w}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2;
                    const updated = widgets.map((w) =>
                      w.id === selectedWidget.id ? { ...w, w: val } : w
                    );
                    setWidgets(updated);
                    setSelectedWidget({ ...selectedWidget, w: val });
                  }}
                  className={`p-2 rounded text-xs focus:outline-none ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"} border`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${textLabel}`}>Grid Height</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={selectedWidget.h}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const updated = widgets.map((w) =>
                      w.id === selectedWidget.id ? { ...w, h: val } : w
                    );
                    setWidgets(updated);
                    setSelectedWidget({ ...selectedWidget, h: val });
                  }}
                  className={`p-2 rounded text-xs focus:outline-none ${isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"} border`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
