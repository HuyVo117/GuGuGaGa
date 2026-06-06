import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";

export default function useDashboard() {
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getStats();
      if (response.success) {
        setStatsData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    statsData,
    loading,
    error,
    fetchStats,
  };
}
