require('dotenv').config();
const Airtable = require('airtable');
const chalk = require('chalk');

// Configuration
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.AIRTABLE_TABLE_NAME;
const fieldsToCompare = (process.env.FIELDS_TO_COMPARE || '').split(',').map(f => f.trim());

if (!apiKey || !baseId || !tableName) {
  console.error(chalk.red('Error: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_NAME must be set in .env'));
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

async function findDuplicates() {
  console.log(chalk.blue(`\n🔍 Searching for duplicates in base "${baseId}", table "${tableName}"...`));
  console.log(chalk.gray(`Comparing fields: ${fieldsToCompare.join(', ')}`));

  const records = [];
  try {
    await base(tableName).select({
      // You can add filters or views here if needed
    }).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      fetchNextPage();
    });
  } catch (error) {
    console.error(chalk.red('Error fetching records from Airtable:'), error.message);
    process.exit(1);
  }

  console.log(chalk.green(`Total records fetched: ${records.length}`));

  const groups = {};

  records.forEach(record => {
    // Normalize and combine fields to create a unique key
    const values = fieldsToCompare.map(field => {
      const val = record.get(field);
      return (val ? String(val).trim().toLowerCase() : '');
    });

    // If all compared fields are empty, skip it or handle as special case?
    // Let's only consider it a duplicate if at least one field is non-empty
    if (values.every(v => v === '')) return;

    const key = values.join('|');

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push({
      id: record.id,
      fields: record.fields
    });
  });

  const duplicates = Object.entries(groups).filter(([key, group]) => group.length > 1);

  if (duplicates.length === 0) {
    console.log(chalk.green('\n✅ No duplicates found!'));
    return;
  }

  console.log(chalk.yellow(`\n⚠️ Found ${duplicates.length} duplicate groups:\n`));

  duplicates.forEach(([key, group], index) => {
    console.log(chalk.bold(`Group ${index + 1}: [Key: ${key}]`));
    group.forEach(record => {
      console.log(` - ID: ${chalk.cyan(record.id)}`);
      fieldsToCompare.forEach(field => {
        console.log(`   ${field}: "${record.fields[field]}"`);
      });
    });
    console.log(chalk.gray('-----------------------------------'));
  });

  // Example of summarizing potential changes (choosing one record as "master")
  console.log(chalk.magenta('\n💡 Possible CleanUp Actions:'));
  const actions = duplicates.map(([key, group]) => {
    const ids = group.map(r => r.id);
    console.log(`Keep one of: ${ids.join(', ')}`);
    return {
      key,
      ids,
      records: group
    };
  });

  // Save to JSON for n8n or further processing
  const fs = require('fs');
  fs.writeFileSync('duplicates.json', JSON.stringify(actions, null, 2));
  console.log(chalk.green(`\n📂 Results saved to duplicates.json`));
}

findDuplicates();
