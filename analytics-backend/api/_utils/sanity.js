const { createClient } = require('@sanity/client');

let cachedClient = null;

function getSanityClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION || '2023-03-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false, // writes go to the live API, not the CDN
  });
  return cachedClient;
}

module.exports = { getSanityClient };
