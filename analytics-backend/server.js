require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Simple authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// Initialize GA4 client
let analyticsDataClient;
try {
  analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
  console.log('✅ Google Analytics Data Client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize GA4 client:', error.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get analytics data
app.get('/api/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { dateRange = '30days' } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!analyticsDataClient) {
      throw new Error('Analytics client not initialized');
    }

    // Calculate date range
    const endDate = 'today';
    let startDate;
    switch (dateRange) {
      case '7days':
        startDate = '7daysAgo';
        break;
      case '90days':
        startDate = '90daysAgo';
        break;
      default:
        startDate = '30daysAgo';
    }

    // Fetch overview metrics
    const [overviewResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'newUsers' },
      ],
    });

    // Fetch page views over time
    const [pageViewsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // Fetch top pages
    const [topPagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    // Fetch top countries
    const [countriesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    // Fetch device data
    const [devicesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
    });

    // Fetch browser data
    const [browsersResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    // Fetch realtime users
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    // Format the data
    const formattedData = formatAnalyticsData({
      overview: overviewResponse,
      pageViews: pageViewsResponse,
      topPages: topPagesResponse,
      countries: countriesResponse,
      devices: devicesResponse,
      browsers: browsersResponse,
      realtime: realtimeResponse,
    });

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
    });
  }
});

// Format analytics data helper
function formatAnalyticsData(responses) {
  const { overview, pageViews, topPages, countries, devices, browsers, realtime } = responses;

  // Parse overview metrics
  const overviewRow = overview.rows?.[0];
  const totalVisits = parseInt(overviewRow?.metricValues[0]?.value || 0);
  const uniqueVisitors = parseInt(overviewRow?.metricValues[1]?.value || 0);
  const pageViewsTotal = parseInt(overviewRow?.metricValues[2]?.value || 0);
  const avgDuration = parseFloat(overviewRow?.metricValues[3]?.value || 0);
  const bounceRate = parseFloat(overviewRow?.metricValues[4]?.value || 0);
  const newUsers = parseInt(overviewRow?.metricValues[5]?.value || 0);

  // Format time
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format page views over time
  const pageViewsData = pageViews.rows?.map(row => ({
    date: formatDate(row.dimensionValues[0].value),
    views: parseInt(row.metricValues[0].value),
    visitors: parseInt(row.metricValues[1].value),
  })) || [];

  // Format top pages
  const topPagesData = topPages.rows?.map(row => ({
    page: row.dimensionValues[1].value,
    title: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value),
    avgTime: formatDuration(parseFloat(row.metricValues[1].value)),
    bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + '%',
  })) || [];

  // Format countries
  const totalCountryUsers = countries.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues[0].value), 0) || 1;
  const topCountriesData = countries.rows?.map(row => {
    const users = parseInt(row.metricValues[0].value);
    return {
      country: row.dimensionValues[0].value,
      visitors: users,
      percentage: Math.round((users / totalCountryUsers) * 100),
    };
  }) || [];

  // Format devices
  const totalDeviceUsers = devices.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues[0].value), 0) || 1;
  const devicesData = devices.rows?.map(row => {
    const users = parseInt(row.metricValues[0].value);
    return {
      device: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalDeviceUsers) * 100),
    };
  }) || [];

  // Format browsers
  const totalBrowserUsers = browsers.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues[0].value), 0) || 1;
  const browsersData = browsers.rows?.map(row => {
    const users = parseInt(row.metricValues[0].value);
    return {
      browser: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalBrowserUsers) * 100),
    };
  }) || [];

  // Realtime users
  const realtimeUsers = parseInt(realtime.rows?.[0]?.metricValues[0]?.value || 0);

  return {
    overview: {
      totalVisits,
      uniqueVisitors,
      pageViews: pageViewsTotal,
      avgSessionDuration: formatDuration(avgDuration),
      bounceRate: (bounceRate * 100).toFixed(1) + '%',
      newVsReturning: {
        new: Math.round((newUsers / uniqueVisitors) * 100),
        returning: Math.round(((uniqueVisitors - newUsers) / uniqueVisitors) * 100),
      },
    },
    pageViews: pageViewsData,
    topPages: topPagesData,
    topCountries: topCountriesData,
    devices: devicesData,
    browsers: browsersData,
    realtimeUsers,
  };
}

// Helper to format dates
function formatDate(dateString) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Analytics Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});



