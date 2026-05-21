import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// custom hook to manage data fetching, filtering, and state for administrative analytics reports
export function useAnalytics(type) {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("MONTH");
  const [rangeMode, setRangeMode] = useState("PRESET");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [methodOptions, setMethodOptions] = useState("ALL");
  const [activeMethod, setActiveMethod] = useState("ALL");
  const [categoryOptions, setCategoryOptions] = useState("ALL");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [classIdOptions, setClassIdOptions] = useState("ALL");
  const [activeClassId, setActiveClassId] = useState("ALL");
  const [statusOptions, setStatusOptions] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  
  const [data, setData] = useState({
    reports: [],
    kpis: {},
    charts: {}
  });

  // helper to normalize date objects into the backend-friendly YYYY-MM-DD format
  const toISODate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // calculates relative start and end boundaries based on user-selected time batches
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

  // central API controller for pulling filtered datasets based on the current view state
  const fetchData = useCallback(async (range, method, category, classId, status) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/reports/${type}`, {
        params: { start: range.start, end: range.end, method, category, classId, status }
      });
      const json = res.data;
      setData({
        reports: json.reports || [],
        kpis: json.kpis || {},
        charts: json.charts || {},
        metadata: json.metadata || {}
      });
    } catch (err) {
      console.error(`[Analytics Hook] Fetch failed for ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // refreshes dashboard data whenever any core filter toggle changes
  useEffect(() => {
    fetchData(activeRange, activeMethod, activeCategory, activeClassId, activeStatus);
  }, [fetchData, activeRange, activeMethod, activeCategory, activeClassId, activeStatus]);

  // manual trigger for syncing local UI state with the active API range
  const updateRange = () => {
    let range;
    if (rangeMode === "CUSTOM") {
      if (!customRange.start || !customRange.end) return;
      range = { ...customRange, label: `Custom (${customRange.start} to ${customRange.end})` };
    } else {
      range = computePresetRange(preset);
    }
    setActiveRange(range);
    setActiveMethod(methodOptions);
    setActiveCategory(categoryOptions);
    setActiveClassId(classIdOptions);
    setActiveStatus(statusOptions);
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
      methodOptions,
      setMethodOptions,
      categoryOptions,
      setCategoryOptions,
      classIdOptions,
      setClassIdOptions,
      statusOptions,
      setStatusOptions,
      updateRange
    }
  };
}
