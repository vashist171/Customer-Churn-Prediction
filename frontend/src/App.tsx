import React, { useState, useEffect } from "react";
import { 
  Database, 
  BrainCircuit, 
  BarChart3, 
  Sparkles, 
  Activity, 
  RefreshCw,
  Play,
  Sun,
  Moon,
  TrendingUp,
  LayoutGrid,
  Menu,
  ChevronRight,
  Info
} from "lucide-react";
import { BIChart } from "./components/Charts";
import { DashboardBuilder } from "./components/DashboardBuilder";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("datasets");
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [columns, setColumns] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [targetCol, setTargetCol] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Model training state
  const [modelName, setModelName] = useState<string>("Random Forest");
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [curves, setCurves] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any>(null);
  
  // Predict & LIME state
  const [predIndex, setPredIndex] = useState<number>(0);
  const [limeExplanations, setLimeExplanations] = useState<any[]>([]);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Business intelligence state
  const [profileSummary, setProfileSummary] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/datasets")
      .then((res) => res.json())
      .then((data) => {
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDataset(data[0]);
        }
      })
      .catch((err) => console.error("Error loading datasets:", err));
  }, []);

  useEffect(() => {
    if (!selectedDataset) return;
    
    fetch(`http://localhost:8000/api/datasets/${selectedDataset}/preview`)
      .then((res) => res.json())
      .then((data) => {
        setColumns(data.columns);
        setPreviewData(data.preview_data);
        const foundTarget = data.columns.find((c: any) => c.name.toLowerCase().includes("churn") || c.name.toLowerCase().includes("exited"));
        if (foundTarget) {
          setTargetCol(foundTarget.name);
        } else if (data.columns.length > 0) {
          setTargetCol(data.columns[data.columns.length - 1].name);
        }
      })
      .catch((err) => console.error("Error loading dataset preview:", err));
  }, [selectedDataset]);

  useEffect(() => {
    if (!selectedDataset || !targetCol) return;
    fetch(`http://localhost:8000/api/datasets/${selectedDataset}/profile?target_col=${targetCol}`)
      .then((res) => res.json())
      .then((data) => setProfileSummary(data))
      .catch((err) => console.error("Error loading profiles:", err));
  }, [selectedDataset, targetCol]);

  const handleTrainModel = () => {
    if (!selectedDataset || !targetCol) return;
    setIsTraining(true);
    fetch("http://localhost:8000/api/models/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: selectedDataset,
        target_col: targetCol,
        model_name: modelName
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics);
        setCurves(data.curves);
        setFeatureImportance(data.feature_importance);
      })
      .finally(() => setIsTraining(false));
  };

  const handleLimeExplanation = () => {
    if (!selectedDataset || !targetCol) return;
    setIsExplaining(true);
    fetch(`http://localhost:8000/api/models/explain-lime?filename=${selectedDataset}&model_name=${modelName}&target_col=${targetCol}&index=${predIndex}`)
      .then((res) => res.json())
      .then((data) => {
        setLimeExplanations(data.explanation || []);
      })
      .finally(() => setIsExplaining(false));
  };

  const isDark = theme === "dark";
  
  // Dashboard Workspace Color Palette
  const bgMain = isDark ? "bg-[#0b0a0f]" : "bg-[#f8f9fc]";
  const bgSidebar = isDark ? "bg-[#141221]/90 backdrop-blur-md border-[#29233b]" : "bg-white/95 backdrop-blur-md border-slate-200";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgCard = isDark ? "bg-[#141221] border-[#29233b]" : "bg-white border-slate-200 shadow-sm";
  const tableHeader = isDark ? "bg-[#1f1a30] text-slate-300" : "bg-slate-100 text-slate-700";
  const tableBorder = isDark ? "border-[#29233b] hover:bg-[#1f1a30]/35" : "border-slate-100 hover:bg-slate-50";

  return (
    <div className={`flex h-screen ${bgMain} ${textPrimary} font-sans overflow-hidden transition-all duration-300`}>
      
      {/* 1. COLLAPSIBLE MODERN SIDEBAR LAYOUT */}
      <aside className={`transition-all duration-300 flex flex-col border-r-2 ${bgSidebar} ${sidebarOpen ? "w-64" : "w-20"} m-4 rounded-3xl overflow-hidden shadow-xl`}>
        <div className="p-5 border-b border-slate-800/10 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl text-[#d4af37]">
                <LayoutGrid size={18} />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wider uppercase">Finnova</h1>
                <span className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">Workspace</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto text-[#d4af37]">
              <LayoutGrid size={22} />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800/10 transition"
          >
            <Menu size={16} className={textSecondary} />
          </button>
        </div>

        {/* Workspace Navigation Pills */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: "datasets", label: "Datasets Manager", icon: <Database size={16} /> },
            { id: "training", label: "Model Trainer", icon: <BrainCircuit size={16} /> },
            { id: "predictions", label: "Churn Predictions", icon: <Activity size={16} /> },
            { id: "dashboard", label: "BI Canvas Builder", icon: <BarChart3 size={16} /> },
            { id: "ai-insights", label: "AI Executive Report", icon: <Sparkles size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/45 shadow-sm" 
                  : `${textSecondary} hover:bg-slate-800/10`
              } ${!sidebarOpen && "justify-center"}`}
              title={tab.label}
            >
              {tab.icon}
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Theme Settings Dock */}
        <div className="p-4 border-t border-slate-800/10 flex items-center justify-between">
          {sidebarOpen && <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Theme mode</span>}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-2.5 rounded-xl border ${isDark ? "border-[#29233b] text-amber-400 hover:bg-slate-800/20" : "border-slate-200 text-slate-750 hover:bg-slate-50"} transition-all mx-auto`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* 2. SPLIT INTERACTIVE WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden m-4 ml-0">
        
        {/* Modern Top Header Controls */}
        <header className={`h-16 border-b-2 ${isDark ? "bg-[#141221]/90 border-[#29233b]" : "bg-white border-slate-200"} rounded-3xl px-8 flex items-center justify-between mb-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className={`border-2 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 ${
                isDark ? "bg-[#1c182a] text-white border-[#29233b]" : "bg-white text-slate-850 border-slate-200"
              }`}
            >
              {datasets.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#d4af37]/10 px-4 py-1.5 rounded-full border border-[#d4af37]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping"></span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#d4af37]">Workspace Live</span>
            </div>
          </div>
        </header>

        {/* Content canvas - floating overlay scrollable screen */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === "datasets" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-wide">Data Profiler & Catalog</h2>
                <p className={`${textSecondary} text-xs mt-1`}>Inspect dimensions, features types, and clean variables.</p>
              </div>

              {/* Data profiling cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Rows</span>
                  <div className="text-2xl font-extrabold mt-2">{previewData.length ? `${previewData.length}+` : "0"}</div>
                </div>
                <div className={`p-5 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Features</span>
                  <div className="text-2xl font-extrabold mt-2">{columns.length}</div>
                </div>
                <div className={`p-5 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Label</span>
                  <select
                    value={targetCol}
                    onChange={(e) => setTargetCol(e.target.value)}
                    className={`mt-2 w-full border-2 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`p-5 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Imputation</span>
                  <div className="text-2xl font-extrabold mt-2 text-emerald-500">Auto-Clean <span className="text-xs font-normal text-slate-400">(0 Missing)</span></div>
                </div>
              </div>

              {/* Dataset schema columns list */}
              <div className={`border-2 rounded-3xl p-6 ${bgCard}`}>
                <h3 className="font-semibold mb-4 text-xs tracking-wider uppercase">Feature Catalog</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className={`text-xs uppercase tracking-wider ${tableHeader}`}>
                      <tr>
                        <th className="px-6 py-3">Column Name</th>
                        <th className="px-6 py-3">Original Type</th>
                        <th className="px-6 py-3">Detected Type</th>
                        <th className="px-6 py-3">Unique Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr key={col.name} className={`border-b ${tableBorder}`}>
                          <td className="px-6 py-4 font-semibold">{col.name}</td>
                          <td className="px-6 py-4 text-slate-450">{col.original_type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${col.detected_type === "numeric" ? "bg-blue-900/30 text-blue-300 border border-blue-800/40" : "bg-purple-900/30 text-purple-300 border border-purple-800/40"}`}>
                              {col.detected_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{col.unique_values}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "training" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-wide">Model Training Pipeline</h2>
                  <p className={`${textSecondary} text-xs mt-1`}>Fit models, adjust splits, and review confusion metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className={`border-2 text-xs rounded-xl px-4 py-2 ${
                      isDark ? "bg-[#141221] text-white border-[#29233b]" : "bg-white text-slate-800 border-slate-200"
                    }`}
                  >
                    {[
                      "Logistic Regression",
                      "Random Forest",
                      "Decision Tree",
                      "XGBoost",
                      "LightGBM",
                      "CatBoost",
                      "Gradient Boosting",
                      "Support Vector Machine",
                      "K-Nearest Neighbors",
                      "Neural Networks"
                    ].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTrainModel}
                    disabled={isTraining}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition"
                  >
                    {isTraining ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                    {isTraining ? "Training..." : "Start Pipeline"}
                  </button>
                </div>
              </div>

              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className={`p-4 rounded-3xl border-2 text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Accuracy</span>
                    <div className="text-lg font-extrabold mt-2 text-white">{(metrics.accuracy * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-3xl border-2 text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Precision</span>
                    <div className="text-lg font-extrabold mt-2 text-white">{(metrics.precision * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-3xl border-2 text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Recall</span>
                    <div className="text-lg font-extrabold mt-2 text-white">{(metrics.recall * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-3xl border-2 text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">F1 Score</span>
                    <div className="text-lg font-extrabold mt-2 text-white">{(metrics.f1 * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-3xl border-2 text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">ROC-AUC</span>
                    <div className="text-lg font-extrabold mt-2 text-emerald-500">{(metrics.auc * 100).toFixed(2)}%</div>
                  </div>
                </div>
              )}

              {curves && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                  <BIChart
                    type="ROC Curve"
                    data={{
                      points: curves.roc.fpr.map((fprVal: number, i: number) => [fprVal, curves.roc.tpr[i]])
                    }}
                    title="Receiver Operating Characteristic (ROC)"
                  />
                  {featureImportance && (
                    <BIChart
                      type="Bar Chart"
                      data={{
                        labels: Object.keys(featureImportance).slice(0, 8),
                        values: Object.values(featureImportance).slice(0, 8)
                      }}
                      title="Relative Feature Importance"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "predictions" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-wide">Risk Predictor</h2>
                <p className={`${textSecondary} text-xs mt-1`}>Analyze driver values for a customer index.</p>
              </div>

              <div className="flex gap-4">
                <div className={`flex-1 p-6 border-2 rounded-3xl space-y-4 ${bgCard}`}>
                  <h3 className="font-semibold text-xs tracking-wider uppercase">Select Customer Index</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={predIndex}
                      onChange={(e) => setPredIndex(parseInt(e.target.value) || 0)}
                      className={`border-2 rounded-xl p-2.5 w-32 focus:outline-none text-xs ${
                        isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-100 border-slate-300 text-slate-900"
                      }`}
                    />
                    <button
                      onClick={handleLimeExplanation}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition"
                    >
                      {isExplaining && <RefreshCw className="animate-spin" size={14} />} Explain Drivers
                    </button>
                  </div>

                  {limeExplanations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Local Predictors</h4>
                      <ul className="space-y-1.5 text-xs">
                        {limeExplanations.map((exp: any, idx: number) => (
                          <li key={idx} className={`flex justify-between p-3 rounded-xl border ${
                            isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}>
                            <span className="font-semibold">{exp[0]}</span>
                            <span className={`font-extrabold ${exp[1] > 0 ? "text-red-500" : "text-emerald-500"}`}>
                              {exp[1] > 0 ? `+${exp[1].toFixed(4)}` : `${exp[1].toFixed(4)}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="h-full">
              <DashboardBuilder datasetData={previewData} columns={columns} theme={theme} />
            </div>
          )}

          {activeTab === "ai-insights" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-wide">AI Executive Summary</h2>
                <p className={`${textSecondary} text-xs mt-1`}>Calculated predictions and strategic recommendations.</p>
              </div>

              {profileSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Cards */}
                  <div className={`p-6 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Churn Rate</span>
                    <div className="text-2xl font-extrabold mt-2 text-[#d4af37]">
                      {profileSummary.churn_rate ? `${(profileSummary.churn_rate * 100).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                  <div className={`p-6 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average CLV</span>
                    <div className="text-2xl font-extrabold mt-2 text-[#d4af37]">
                      {profileSummary.clv_average ? `$${profileSummary.clv_average.toFixed(2)}` : "N/A"}
                    </div>
                  </div>
                  <div className={`p-6 rounded-3xl border-2 ${bgCard} transition hover:translate-y-[-2px]`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue At Risk</span>
                    <div className="text-2xl font-extrabold mt-2 text-red-500">
                      {profileSummary.revenue_at_risk ? `$${profileSummary.revenue_at_risk.toLocaleString()}` : "N/A"}
                    </div>
                  </div>
                </div>
              )}

              {profileSummary?.ai_insights && (
                <div className={`p-6 border-2 rounded-3xl space-y-4 ${bgCard}`}>
                  <h3 className="font-semibold text-xs tracking-wider uppercase">Strategic Recommendations</h3>
                  <div className="space-y-3">
                    {profileSummary.ai_insights.map((insight: string, idx: number) => (
                      <div key={idx} className={`flex gap-3 items-start p-3.5 rounded-xl border ${
                        isDark ? "bg-[#1f1a30]/30 border-[#29233b] text-slate-200" : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}>
                        <p className="text-xs font-semibold leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
