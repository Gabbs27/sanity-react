const { requireAdmin } = require('./_utils/auth');
const { getClient, applyCors, formatAnalyticsData } = require('./_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const dateRange = req.query.dateRange || '30days';
    const propertyId = process.env.GA4_PROPERTY_ID;
    const client = getClient();

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

    const [overviewResponse] = await client.runReport({
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

    const [pageViewsResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const [topPagesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const [countriesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    const [devicesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
    });

    const [browsersResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    const [realtimeResponse] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    // The affiliate report depends on `link_domain` being registered as a
    // GA4 Custom Dimension on the property. If it isn't (yet), GA4 returns
    // INVALID_ARGUMENT and the whole report would otherwise blow up. Wrap
    // the call so we degrade to "no affiliate data" instead of failing the
    // entire dashboard.
    let affiliateResponse = null;
    try {
      const [resp] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:link_domain' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'affiliate_click', matchType: 'EXACT' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      });
      affiliateResponse = resp;
    } catch (err) {
      console.warn(
        'Affiliate query failed (likely link_domain custom dimension not registered):',
        err.message
      );
      affiliateResponse = { rows: [] };
    }

    const formatted = formatAnalyticsData({
      overview: overviewResponse,
      pageViews: pageViewsResponse,
      topPages: topPagesResponse,
      countries: countriesResponse,
      devices: devicesResponse,
      browsers: browsersResponse,
      realtime: realtimeResponse,
      affiliate: affiliateResponse,
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
    });
  }
};
