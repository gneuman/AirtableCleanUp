const Airtable = require('airtable');

function smartNormalize(value, fieldName = '') {
  if (!value) return '';
  let str = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (fieldName.toLowerCase().includes('website') || fieldName.toLowerCase().includes('url')) {
    str = str.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  } else {
    str = str.replace(/[^a-z0-9]/g, "");
  }
  return str;
}

module.exports = async (req, res) => {
  const { apiKey, baseId, tableName, fieldsToCompare, checkboxField, linkField, onlyUnprocessed } = req.body;
  const fields = fieldsToCompare.split(',').map(f => f.trim());
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    const records = [];
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
        
        // 1. Verificar COINCIDENCIA
        let hasMatch = false;
        for (let idx = 0; idx < fields.length; idx++) {
          if (masterNorms[idx].val !== '' && masterNorms[idx].val === candidateNorms[idx].val) {
            hasMatch = true;
            break;
          }
        }

        // 2. Verificar CONFLICTO (Email/LinkedIn/Phone)
        let hasConflict = false;
        if (hasMatch) {
          for (let idx = 0; idx < fields.length; idx++) {
            const fieldName = masterNorms[idx].name;
            const mVal = masterNorms[idx].val;
            const cVal = candidateNorms[idx].val;

            if (mVal !== '' && cVal !== '' && mVal !== cVal) {
              if (fieldName.includes('email') || fieldName.includes('linkedin') || fieldName.includes('phone')) {
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
        
        // DETECCIÓN PROGRAMÁTICA DE PROCESADOS:
        // Un grupo está procesado si:
        // a) El checkboxField está marcado en TODOS los registros (menos quizás el master)
        // b) O si ya existe un enlace en linkField entre ellos
        
        const hasUnprocessedCheckbox = groupRecords.some(r => !r.get(checkboxField));
        
        // Revisar si ya están enlazados mediante el campo linkField
        let alreadyLinked = false;
        if (linkField) {
            const masterLinks = masterCandidate.get(linkField) || [];
            const masterLinksIds = Array.isArray(masterLinks) ? masterLinks : [masterLinks];
            
            // Si el master ya apunta a alguno de los otros en el grupo, lo consideramos vinculado
            alreadyLinked = groupRecords.some(r => {
                if (r.id === masterCandidate.id) return false;
                return masterLinksIds.includes(r.id);
            });
        }

        const isProcessed = !hasUnprocessedCheckbox || alreadyLinked;

        // Si el usuario pidió solo pendientes, ocultamos los ya procesados/enlazados
        if (onlyUnprocessed === 'true' && isProcessed) {
          continue;
        }

        groups.push({
          key: "Potential Duplicate Group",
          isProcessed: isProcessed,
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
