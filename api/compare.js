const Airtable = require('airtable');

function smartNormalize(value, fieldName = '') {
  if (!value) return '';
  let str = String(value).trim().toLowerCase();
  if (fieldName.toLowerCase().includes('website') || fieldName.toLowerCase().includes('url')) {
    str = str.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  } else {
    str = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
  }
  return str.trim();
}

module.exports = async (req, res) => {
  const { apiKey, baseId, tableName, masterId, fieldsToCompare } = req.body;
  const fields = fieldsToCompare.split(',').map(f => f.trim());
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    const masterRecord = await base(tableName).find(masterId);
    const masterNorms = fields.map(f => smartNormalize(masterRecord.get(f), f));

    const allRecords = [];
    await base(tableName).select({}).eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      fetchNextPage();
    });

    const matches = allRecords.filter(rec => {
      if (rec.id === masterId) return false;
      const candidateNorms = fields.map(f => smartNormalize(rec.get(f), f));
      
      // Coincide en CUALQUIERA de los campos especificados
      return masterNorms.some((mVal, idx) => {
        const cVal = candidateNorms[idx];
        return mVal !== '' && cVal !== '' && mVal === cVal;
      });
    });

    return res.status(200).json({
      master: { id: masterRecord.id, fields: masterRecord.fields },
      matches: matches.map(m => ({ id: m.id, fields: m.fields })),
      fields
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
