const Airtable = require('airtable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, baseId, tableName, masterId, copyIds, checkboxField, linkField } = req.body;
  const base = new Airtable({ apiKey }).base(baseId);

  try {
    // Única actualización: Solo al Registro Maestro
    const updatedMaster = await base(tableName).update(masterId, {
      [checkboxField]: true,
      [linkField]: copyIds // Lista de IDs de los duplicados vinculados
    });

    return res.status(200).json({ 
      success: true, 
      updatedCount: 1, 
      masterId: updatedMaster.id 
    });
  } catch (error) {
    console.error("Airtable Update Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
