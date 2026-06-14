const XLSX = require('xlsx');


// Generate 2500 repair items for Kone
const pricingData = [];
const equipmentTypes = ['Escalator', 'Elevator', 'Door System', 'Ramp', 'Platform Screen', 'Modernization Kit'];
const categories = ['Maintenance', 'Emergency Repair', 'Installation', 'Upgrade', 'Certification', 'Inspection'];
const availability = ['Available', 'On-Call', 'Scheduled', 'Available 24/7'];

for (let i = 1; i <= 2500; i++) {
  const repairId = `RPR-${String(i).padStart(5, '0')}`;
  const equipmentType = equipmentTypes[i % equipmentTypes.length];
  const category = categories[i % categories.length];
  const basePrice = 300 + (i % 5000);
  const serviceHours = 1 + (i % 16);
  const avail = availability[i % availability.length];
  
  pricingData.push({
    'Repair ID': repairId,
    'Equipment Type': equipmentType,
    'Service Category': category,
    'Base Price': basePrice,
    'Service Hours': serviceHours,
    'Availability': avail,
    'Description': `Service for ${equipmentType} - ${category}`,
    'Notes': `Item #${i} - Region: EMEA`,
    'Labor Cost': Math.round(basePrice * 0.4),
    'Parts Cost': Math.round(basePrice * 0.3),
    'Warranty Period': `${3 + (i % 4)} months`,
    'SLA Target': `${4 + (i % 24)} hours`,
  });
}

// Create workbook with multiple sheets
const wb = XLSX.utils.book_new();

// Add Pricing Management sheet (main sheet with 2500 rows)
const pricingSheet = XLSX.utils.json_to_sheet(pricingData);
XLSX.utils.book_append_sheet(wb, pricingSheet, 'Pricing Management');

// Add summary sheet
const summaryData = [
  { Metric: 'Total Items', Value: 2500 },
  { Metric: 'Equipment Types', Value: equipmentTypes.length },
  { Metric: 'Service Categories', Value: categories.length },
  { Metric: 'Average Price', Value: Math.round(pricingData.reduce((sum, item) => sum + item['Base Price'], 0) / pricingData.length) },
  { Metric: 'Date Created', Value: new Date().toISOString().split('T')[0] },
];
const summarySheet = XLSX.utils.json_to_sheet(summaryData);
XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

// Add Equipment Reference sheet
const equipmentData = equipmentTypes.map((type, idx) => ({
  'Equipment Type': type,
  'Description': `${type} services and maintenance`,
  'Typical Service Time': `${2 + idx} hours`,
  'Min Base Price': 300,
}));
const equipmentSheet = XLSX.utils.json_to_sheet(equipmentData);
XLSX.utils.book_append_sheet(wb, equipmentSheet, 'Equipment Reference');

// Save file
XLSX.writeFile(wb, '/tmp/kone_repair_catalog_2500.xlsx');