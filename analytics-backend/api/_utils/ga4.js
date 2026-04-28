const { BetaAnalyticsDataClient } = require('@google-analytics/data');

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
  return cachedClient;
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((u) => u.trim());

  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-File-Type, X-File-Name'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}

function formatDate(dateString) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatAnalyticsData(responses) {
  const { overview, pageViews, topPages, countries, devices, browsers, realtime } = responses;

  const affiliateData = (responses.affiliate?.rows || []).map((row) => ({
    domain: row.dimensionValues[1]?.value || 'unknown',
    clicks: parseInt(row.metricValues[0].value),
  })).filter((r) => r.domain && r.domain !== '(not set)');

  const overviewRow = overview.rows?.[0];
  const totalVisits = parseInt(overviewRow?.metricValues[0]?.value || 0);
  const uniqueVisitors = parseInt(overviewRow?.metricValues[1]?.value || 0);
  const pageViewsTotal = parseInt(overviewRow?.metricValues[2]?.value || 0);
  const avgDuration = parseFloat(overviewRow?.metricValues[3]?.value || 0);
  const bounceRate = parseFloat(overviewRow?.metricValues[4]?.value || 0);
  const newUsers = parseInt(overviewRow?.metricValues[5]?.value || 0);

  const pageViewsData = pageViews.rows?.map((row) => ({
    date: formatDate(row.dimensionValues[0].value),
    views: parseInt(row.metricValues[0].value),
    visitors: parseInt(row.metricValues[1].value),
  })) || [];

  const topPagesData = topPages.rows?.map((row) => ({
    page: row.dimensionValues[1].value,
    title: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value),
    avgTime: formatDuration(parseFloat(row.metricValues[1].value)),
    bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + '%',
  })) || [];

  const totalCountryUsers = countries.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const topCountriesData = countries.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      country: row.dimensionValues[0].value,
      visitors: users,
      percentage: Math.round((users / totalCountryUsers) * 100),
    };
  }) || [];

  const totalDeviceUsers = devices.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const devicesData = devices.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      device: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalDeviceUsers) * 100),
    };
  }) || [];

  const totalBrowserUsers = browsers.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const browsersData = browsers.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      browser: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalBrowserUsers) * 100),
    };
  }) || [];

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
    affiliateClicks: affiliateData,
  };
}

module.exports = { getClient, applyCors, formatAnalyticsData };
