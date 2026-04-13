import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Professional Analytics Hook
 * Handles date range logic, API fetching, and dashboard state.
 */
export function useAnalytics(type) {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("MONTH");
  const [rangeMode, setRangeMode] = useState("PRESET");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  
  const [data, setData] = useState({
    reports: [],
    kpis: {},
    charts: {}
  });

  const toISODate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const computePresetRange = (presetValue) => {
    const today = new Date();
    const startOfDay = (d) => { d.setHours(0,0,0,0); return d; };
    const startOfMonth = (d) => startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));

    switch (presetValue) {
      case "TODAY":
        return { start: toISODate(today), end: toISODate(today), label: "Today" };
      case "WEEK":
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return { start: toISODate(startOfDay(new Date(today.setDate(diff)))), end: toISODate(new Date()), label: "This Week" };
      case "MONTH":
        return { start: toISODate(startOfMonth(new Date())), end: toISODate(today), label: "This Month" };
      case "3_MONTHS":
        const t3 = new Date(); t3.setMonth(today.getMonth() - 3);
        return { start: toISODate(t3), end: toISODate(today), label: "Last 3 Months" };
      case "YEAR":
        const ty = new Date(); ty.setFullYear(today.getFullYear() - 1);
        return { start: toISODate(ty), end: toISODate(today), label: "Last 1 Year" };
      default:
        return { start: toISODate(startOfMonth(new Date())), end: toISODate(today), label: "This Month" };
    }
  };

  const [activeRange, setActiveRange] = useState(() => computePresetRange("MONTH"));

  const fetchData = useCallback(async (range) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/reports/${type}?start=${range.start}&end=${range.end}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData({
        reports: json.reports || [],
        kpis: json.kpis || {},
        charts: json.charts || {}
      });
    } catch (err) {
      console.error(`[Analytics Hook] Fetch failed for ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Initial load
  useEffect(() => {
    fetchData(activeRange);
  }, [fetchData, activeRange]);

  const updateRange = () => {
    let range;
    if (rangeMode === "CUSTOM") {
      if (!customRange.start || !customRange.end) return;
      range = { ...customRange, label: `Custom (${customRange.start} to ${customRange.end})` };
    } else {
      range = computePresetRange(preset);
    }
    setActiveRange(range);
  };

  return {
    loading,
    data,
    activeRange,
    controls: {
      preset, 
      setPreset: (val) => { 
        setPreset(val); 
        setRangeMode("PRESET");
        const range = computePresetRange(val);
        setCustomRange({ start: range.start, end: range.end });
      },
      customRange,
      setCustomRange: (val) => { setCustomRange(val); setRangeMode("CUSTOM"); },
      updateRange
    }
  };
}
