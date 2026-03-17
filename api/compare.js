const Airtable = require('airtable');

function smartNormalize(value, fieldName = '') {
  if (!value) return '';
  // Eliminar acentos y diacríticos, pasar a minúsculas y limpiar espacios
  let str = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (fieldName.toLowerCase().includes('website') || fieldName.toLowerCase().includes('url')) {
    str = str.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  } else {
    // Mantener solo letras y números para comparaciones de texto/nombres
    str = str.replace(/[^a-z0-9]/g, "");
  }
  return str;
}

module.exports = async (req, res) => {
  const { apiKey, baseId, tableName, masterId, fieldsToCompare } = req.body;
  const fields = fieldsToCompare.split(',').map(f => f.trim());
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    const masterRecord = await base(tableName).find(masterId);
    const masterNorms = fields.map(f => ({
      name: f.toLowerCase(),
      val: smartNormalize(masterRecord.get(f), f)
    }));

    const allRecords = [];
    await base(tableName).select({}).eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      fetchNextPage();
    });

    const matches = allRecords.filter(rec => {
      if (rec.id === masterId) return false;
      const candidateNorms = fields.map(f => smartNormalize(rec.get(f), f));
      
      // 1. Verificar COINCIDENCIA
      let hasMatch = false;
      for (let idx = 0; idx < fields.length; idx++) {
        const cVal = candidateNorms[idx];
        if (masterNorms[idx].val !== '' && masterNorms[idx].val === cVal) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) return false;

      // 2. Verificar CONFLICTO
      for (let idx = 0; idx < fields.length; idx++) {
        const fieldName = masterNorms[idx].name;
        const mVal = masterNorms[idx].val;
        const cVal = candidateNorms[idx].val;

        if (mVal !== '' && cVal !== '' && mVal !== cVal) {
          if (fieldName.includes('email') || fieldName.includes('linkedin') || fieldName.includes('phone') || fieldName.includes('mobile')) {
            return false; // Conflicto detectado
          }
        }
      }

      return true;
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
