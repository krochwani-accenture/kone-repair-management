// backend/users.js
module.exports = [
  {
    username: 'admin',
    password: 'demo123', // demo only
    role: 'global',
    regions: ['ALL'],
  },
  {
    username: 'emea_user',
    password: 'demo123',
    role: 'region',
    regions: ['EMEA'],
  },
  {
    username: 'apac_user',
    password: 'demo123',
    role: 'region',
    regions: ['APAC'],
  },
];