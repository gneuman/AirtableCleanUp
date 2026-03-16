const https = require('https');

module.exports = async (req, res) => {
  const { apiKey, baseId } = req.query;

  if (!apiKey || !baseId) {
    return res.status(400).json({ error: 'apiKey and baseId are required' });
  }

  const options = {
    hostname: 'api.airtable.com',
    path: `/v0/meta/bases/${baseId}/tables`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          if (response.statusCode >= 400) {
            reject(new Error(`Airtable API error ${response.statusCode}: ${body}`));
          } else {
            resolve(JSON.parse(body));
          }
        });
      });
      request.on('error', reject);
      request.end();
    });

    // Devolver solo lo necesario: tablas con sus campos (id, name, type)
    const tables = (data.tables || []).map(t => ({
      id: t.id,
      name: t.name,
      fields: (t.fields || []).map(f => ({ id: f.id, name: f.name, type: f.type }))
    }));

    return res.status(200).json({ tables });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
