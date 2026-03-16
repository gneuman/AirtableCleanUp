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
  const { apiKey, baseId, tableName, fieldsToCompare, checkboxField, onlyUnprocessed } = req.body;
  const fields = fieldsToCompare.split(',').map(f => f.trim());
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    const selectOptions = {};
    
    // Si el usuario quiere solo pendientes, aplicamos fórmula de Airtable
    if (onlyUnprocessed === 'true' && checkboxField) {
      selectOptions.filterByFormula = `NOT({${checkboxField}})`;
    }

    const records = [];
    await base(tableName).select(selectOptions).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      fetchNextPage();
    });

    const groups = [];
    const visited = new Set();

    for (let i = 0; i < records.length; i++) {
      const masterCandidate = records[i];
      if (visited.has(masterCandidate.id)) continue;

      const groupRecords = [masterCandidate];
      const masterNorms = fields.map(f => smartNormalize(masterCandidate.get(f), f));

      for (let j = i + 1; j < records.length; j++) {
        const candidate = records[j];
        if (visited.has(candidate.id)) continue;

        const candidateNorms = fields.map(f => smartNormalize(candidate.get(f), f));
        const isMatch = masterNorms.some((mVal, idx) => mVal !== '' && candidateNorms[idx] !== '' && mVal === candidateNorms[idx]);

        if (isMatch) {
          groupRecords.push(candidate);
          visited.add(candidate.id);
        }
      }

      if (groupRecords.length > 1) {
        visited.add(masterCandidate.id);
        const isAnyProcessed = groupRecords.some(r => r.get(checkboxField) === true);

        groups.push({
          key: "Potential Duplicate Group",
          isProcessed: isAnyProcessed,
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
