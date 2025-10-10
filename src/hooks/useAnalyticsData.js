import { useState, useEffect } from "react";

/**
 * useAnalyticsData - Hook para obtener datos de Google Analytics
 * Usa datos reales del backend si adminToken está presente, sino usa datos mock
 * 
 * @param {string} dateRange - Rango de fechas: "7days", "30days", "90days"
 * @param {string} adminToken - Token de autenticación admin (opcional)
 * @param {boolean} useMock - Forzar uso de datos mock (para demo público)
 */

export const useAnalyticsData = (dateRange = "30days", adminToken = null, useMock = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Si useMock es true o no hay token, usar datos mock
        if (useMock || !adminToken) {
          const mockData = generateMockData(dateRange);
          // Simular delay de API
          await new Promise(resolve => setTimeout(resolve, 500));
          setData(mockData);
          setLoading(false);
          return;
        }
        
        // Llamar al backend con datos reales
        const apiUrl = process.env.REACT_APP_ANALYTICS_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/api/analytics?dateRange=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const realData = await response.json();
        setData(realData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
        
        // Fallback to mock data on error
        const mockData = generateMockData(dateRange);
        setData(mockData);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, adminToken, useMock]);

  return { data, loading, error };
};

// Generar datos mock realistas
const generateMockData = (dateRange) => {
  const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
  
  return {
    overview: {
      totalVisits: Math.floor(Math.random() * 10000) + 5000,
      uniqueVisitors: Math.floor(Math.random() * 8000) + 3000,
      pageViews: Math.floor(Math.random() * 25000) + 10000,
      avgSessionDuration: "3:42",
      bounceRate: (Math.random() * 20 + 30).toFixed(1) + "%",
      newVsReturning: {
        new: 65,
        returning: 35,
      },
    },
    
    pageViews: Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: Math.floor(Math.random() * 500) + 100,
        visitors: Math.floor(Math.random() * 300) + 50,
      };
    }),
    
    topPages: [
      { page: "/", views: 4521, avgTime: "4:32", bounceRate: "42%" },
      { page: "/allpost", views: 2134, avgTime: "5:12", bounceRate: "38%" },
      { page: "/services", views: 1876, avgTime: "3:45", bounceRate: "45%" },
      { page: "/about", views: 1543, avgTime: "2:58", bounceRate: "51%" },
      { page: "/gabriel-abreu", views: 1234, avgTime: "2:15", bounceRate: "35%" },
    ],
    
    topCountries: [
      { country: "United States", visitors: 3421, percentage: 42 },
      { country: "United Kingdom", visitors: 1234, percentage: 15 },
      { country: "Canada", visitors: 987, percentage: 12 },
      { country: "Germany", visitors: 765, percentage: 9 },
      { country: "France", visitors: 543, percentage: 7 },
      { country: "Spain", visitors: 432, percentage: 5 },
      { country: "Others", visitors: 821, percentage: 10 },
    ],
    
    devices: [
      { device: "Desktop", users: 4521, percentage: 55 },
      { device: "Mobile", users: 2987, percentage: 36 },
      { device: "Tablet", users: 743, percentage: 9 },
    ],
    
    browsers: [
      { browser: "Chrome", users: 5432, percentage: 66 },
      { browser: "Safari", users: 1543, percentage: 19 },
      { browser: "Firefox", users: 821, percentage: 10 },
      { browser: "Edge", users: 321, percentage: 4 },
      { browser: "Others", users: 87, percentage: 1 },
    ],
    
    realtimeUsers: Math.floor(Math.random() * 50) + 10,
  };
};

export default useAnalyticsData;

