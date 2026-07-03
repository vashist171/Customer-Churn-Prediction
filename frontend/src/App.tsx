import React, { useState, useEffect } from "react";
import { 
  Database, 
  BrainCircuit, 
  BarChart3, 
  Sparkles, 
  LineChart,
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Play,
  Sun,
  Moon
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
    // Fetch available datasets
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
    
    // Load dataset details and preview
    fetch(`http://localhost:8000/api/datasets/${selectedDataset}/preview`)
      .then((res) => res.json())
      .then((data) => {
        setColumns(data.columns);
        setPreviewData(data.preview_data);
        // Autodetect churn target column
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
    // Load intelligence statistics
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
  const bgMain = isDark ? "bg-[#0b0a0f]" : "bg-slate-50";
  const bgSidebar = isDark ? "bg-[#14121f] border-[#2b243c]" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgHeader = isDark ? "bg-[#0b0a0f] border-[#2b243c]" : "bg-white border-slate-200";
  const bgCard = isDark ? "bg-[#1c182a] border-[#2b243c]" : "bg-white border-slate-200 shadow-sm";
  const tableHeader = isDark ? "bg-[#252037] text-slate-300" : "bg-slate-100 text-slate-700";
  const tableBorder = isDark ? "border-[#2b243c] hover:bg-[#252037]/35" : "border-slate-100 hover:bg-slate-50";

  return (
    <div className={`flex h-screen ${bgMain} ${textPrimary} font-sans overflow-hidden transition-colors duration-250`}>
      {/* Sidebar Workspace */}
      <aside className={`w-64 ${bgSidebar} border-r flex flex-col`}>
        <div className="p-6 border-b border-slate-800/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Antigravity</h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">BI Analytics Workspace</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("datasets")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "datasets" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${textSecondary} hover:bg-blue-600/10`
            }`}
          >
            <Database size={16} /> Datasets manager
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "training" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${textSecondary} hover:bg-blue-600/10`
            }`}
          >
            <BrainCircuit size={16} /> Model Trainer
          </button>
          <button
            onClick={() => setActiveTab("predictions")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "predictions" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${textSecondary} hover:bg-blue-600/10`
            }`}
          >
            <Activity size={16} /> Churn Predictions
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${textSecondary} hover:bg-blue-600/10`
            }`}
          >
            <BarChart3 size={16} /> Customizable BI Canvas
          </button>
          <button
            onClick={() => setActiveTab("ai-insights")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "ai-insights" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${textSecondary} hover:bg-blue-600/10`
            }`}
          >
            <Sparkles size={16} /> AI Business Insights
          </button>
        </nav>

        {/* Theme Toggler inside footer of Sidebar */}
        <div className="p-4 border-t border-slate-800/10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Theme</span>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-2 rounded-lg border ${isDark ? "border-slate-800 text-amber-400 hover:bg-slate-900" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* Workspace Panel */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-16 border-b ${bgHeader} px-8 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Active dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className={`border text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isDark ? "bg-[#111827] text-white border-slate-800" : "bg-white text-slate-800 border-slate-200"
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
            <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Live Workspace active</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "datasets" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Dataset Manager</h2>
                <p className={`${textSecondary} text-sm mt-1`}>Explore structure, profiles, missing variables, and distributions.</p>
              </div>

              {/* Data profiling cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${bgCard}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Rows</span>
                  <div className="text-2xl font-extrabold mt-2">{previewData.length ? `${previewData.length}+` : "0"}</div>
                </div>
                <div className={`p-5 rounded-2xl border ${bgCard}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Features</span>
                  <div className="text-2xl font-extrabold mt-2">{columns.length}</div>
                </div>
                <div className={`p-5 rounded-2xl border ${bgCard}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target Variable</span>
                  <select
                    value={targetCol}
                    onChange={(e) => setTargetCol(e.target.value)}
                    className={`mt-2 w-full border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none ${
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
                <div className={`p-5 rounded-2xl border ${bgCard}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Imputation Status</span>
                  <div className="text-2xl font-extrabold mt-2 text-emerald-500">Clean <span className="text-xs font-normal text-slate-400">(0 Missing)</span></div>
                </div>
              </div>

              {/* Dataset schema columns list */}
              <div className={`border rounded-2xl p-6 ${bgCard}`}>
                <h3 className="font-semibold mb-4">Column Definitions & Profiling</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase ${tableHeader}`}>
                      <tr>
                        <th className="px-6 py-3">Column Name</th>
                        <th className="px-6 py-3">Original Type</th>
                        <th className="px-6 py-3">Detected Type</th>
                        <th className="px-6 py-3">Unique values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr key={col.name} className={`border-b ${tableBorder}`}>
                          <td className="px-6 py-4 font-medium">{col.name}</td>
                          <td className="px-6 py-4">{col.original_type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs ${col.detected_type === "numeric" ? "bg-blue-900/40 text-blue-300" : "bg-purple-900/40 text-purple-300"}`}>
                              {col.detected_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold">{col.unique_values}</td>
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
                  <h2 className="text-2xl font-bold">Model Trainer & Comparison</h2>
                  <p className={`${textSecondary} text-sm mt-1`}>Train classifier algorithms and review model metrics side-by-side.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className={`border text-sm rounded-lg px-4 py-2 ${
                      isDark ? "bg-[#1f2937] text-white border-slate-700" : "bg-white text-slate-800 border-slate-200"
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
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-white flex items-center gap-2 transition"
                  >
                    {isTraining ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                    {isTraining ? "Training..." : "Train Model"}
                  </button>
                </div>
              </div>

              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className={`p-4 rounded-2xl border text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Accuracy</span>
                    <div className="text-xl font-bold mt-2">{(metrics.accuracy * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Precision</span>
                    <div className="text-xl font-bold mt-2">{(metrics.precision * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">Recall</span>
                    <div className="text-xl font-bold mt-2">{(metrics.recall * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">F1 Score</span>
                    <div className="text-xl font-bold mt-2">{(metrics.f1 * 100).toFixed(2)}%</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400">ROC-AUC</span>
                    <div className="text-xl font-bold mt-2 text-emerald-500">{(metrics.auc * 100).toFixed(2)}%</div>
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
                <h2 className="text-2xl font-bold">Interactive Customer Risk Predictions</h2>
                <p className={`${textSecondary} text-sm mt-1`}>Review model probability outputs alongside local LIME model explainer rules.</p>
              </div>

              <div className="flex gap-4">
                <div className={`flex-1 p-6 border rounded-2xl space-y-4 ${bgCard}`}>
                  <h3 className="font-semibold">Select Customer Index</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={predIndex}
                      onChange={(e) => setPredIndex(parseInt(e.target.value) || 0)}
                      className={`border rounded p-2.5 w-32 focus:outline-none text-sm ${
                        isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-100 border-slate-300 text-slate-900"
                      }`}
                    />
                    <button
                      onClick={handleLimeExplanation}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium text-white flex items-center gap-2 transition"
                    >
                      {isExplaining && <RefreshCw className="animate-spin" size={14} />} Explain with LIME
                    </button>
                  </div>

                  {limeExplanations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase">Top Local Churn Drivers</h4>
                      <ul className="space-y-1.5 text-sm">
                        {limeExplanations.map((exp: any, idx: number) => (
                          <li key={idx} className={`flex justify-between p-3 rounded border ${
                            isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}>
                            <span className="font-medium">{exp[0]}</span>
                            <span className={`font-semibold ${exp[1] > 0 ? "text-red-500" : "text-emerald-500"}`}>
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
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  AI Insights Executive Report
                </h2>
                <p className={`${textSecondary} text-sm mt-1`}>Automatically computed stats, retention rules, and customer lifetime value (CLV).</p>
              </div>

              {profileSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Executive Summary Cards */}
                  <div className={`p-6 rounded-2xl border ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Average Churn Probability</span>
                    <div className="text-3xl font-extrabold mt-2">
                      {profileSummary.churn_rate ? `${(profileSummary.churn_rate * 100).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">CLV (Average)</span>
                    <div className="text-3xl font-extrabold mt-2">
                      {profileSummary.clv_average ? `$${profileSummary.clv_average.toFixed(2)}` : "N/A"}
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${bgCard}`}>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Revenue At Risk</span>
                    <div className="text-3xl font-extrabold mt-2">
                      {profileSummary.revenue_at_risk ? `$${profileSummary.revenue_at_risk.toLocaleString()}` : "N/A"}
                    </div>
                  </div>
                </div>
              )}

              {profileSummary?.ai_insights && (
                <div className={`p-6 border rounded-2xl space-y-4 ${bgCard}`}>
                  <h3 className="font-semibold">Insight Narratives</h3>
                  <div className="space-y-3">
                    {profileSummary.ai_insights.map((insight: string, idx: number) => (
                      <div key={idx} className={`flex gap-3 items-start p-3 rounded-lg border ${
                        isDark ? "bg-slate-950 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{insight}</p>
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
