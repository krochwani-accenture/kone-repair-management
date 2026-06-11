const XLSX = require('xlsx');

const data = [
  {
    'Repair ID': 'RPR-001',
    'Equipment Type': 'Escalator',
    'Service Category': 'Maintenance',
    'Base Price': 500,
    'Service Hours': 2,
    'Availability': 'Available',
    'Description': 'Regular escalator maintenance',
    'Notes': 'Includes inspection and lubrication'
  },
  {
    'Repair ID': 'RPR-002',
    'Equipment Type': 'Elevator',
    'Service Category': 'Emergency Repair',
    'Base Price': 1200,
    'Service Hours': 4,
    'Availability': 'On-Call',
    'Description': 'Emergency elevator repair service',
    'Notes': '24/7 availability'
  },
  {
    'Repair ID': 'RPR-003',
    'Equipment Type': 'Escalator',
    'Service Category': 'Installation',
    'Base Price': 5000,
    'Service Hours': 16,
    'Availability': 'Available',
    'Description': 'New escalator installation',
    'Notes': 'Includes testing and certification'
  }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Repairs');
XLSX.writeFile(wb, '/tmp/sample_repairs.xlsx');
console.log('Sample file created');
