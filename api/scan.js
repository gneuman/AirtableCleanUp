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
  const { apiKey, baseId, tableName, fieldsToCompare, checkboxField, onlyUnprocessed } = req.body;
  const fields = fieldsToCompare.split(',').map(f => f.trim());
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    const records = [];
    // Descargamos todo para poder comparar registros nuevos contra viejos
    await base(tableName).select({}).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      fetchNextPage();
    });

    const groups = [];
    const visited = new Set();

    for (let i = 0; i < records.length; i++) {
      const masterCandidate = records[i];
      if (visited.has(masterCandidate.id)) continue;

      const masterNorms = fields.map(f => ({ 
        name: f.toLowerCase(), 
        val: smartNormalize(masterCandidate.get(f), f) 
      }));

      const groupRecords = [masterCandidate];

      for (let j = i + 1; j < records.length; j++) {
        const candidate = records[j];
        if (visited.has(candidate.id)) continue;

        const candidateNorms = fields.map(f => ({ 
          name: f.toLowerCase(), 
          val: smartNormalize(candidate.get(f), f) 
        }));
        
        // 1. Verificar si hay COINCIDENCIA en al menos un campo
        let hasMatch = false;
        for (let idx = 0; idx < fields.length; idx++) {
          if (masterNorms[idx].val !== '' && masterNorms[idx].val === candidateNorms[idx].val) {
            hasMatch = true;
            break;
          }
        }

        // 2. Verificar si hay CONFLICTO en campos críticos
        let hasConflict = false;
        if (hasMatch) {
          for (let idx = 0; idx < fields.length; idx++) {
            const fieldName = masterNorms[idx].name;
            const mVal = masterNorms[idx].val;
            const cVal = candidateNorms[idx].val;

            if (mVal !== '' && cVal !== '' && mVal !== cVal) {
              if (fieldName.includes('email') || fieldName.includes('linkedin') || fieldName.includes('phone') || fieldName.includes('mobile')) {
                hasConflict = true;
                break;
              }
            }
          }
        }

        if (hasMatch && !hasConflict) {
          groupRecords.push(candidate);
          visited.add(candidate.id);
        }
      }

      if (groupRecords.length > 1) {
        visited.add(masterCandidate.id);
        
        const hasUnprocessed = groupRecords.some(r => !r.get(checkboxField));
        const isAnyProcessed = groupRecords.some(r => r.get(checkboxField) === true);

        // Si el usuario pidió solo pendientes, solo mostramos el grupo si tiene al menos uno sin procesar
        if (onlyUnprocessed === 'true' && !hasUnprocessed) {
          continue;
        }

        groups.push({
          key: "Potential Duplicate Group",
          isProcessed: isAnyProcessed && !hasUnprocessed,
          records: groupRecords.map(r => ({ 
            id: r.id, 
            fields: r.fields,
            isMarked: r.get(checkboxField) === true 
          }))
        });
      }
    }

    return res.status(200).json(groups);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
