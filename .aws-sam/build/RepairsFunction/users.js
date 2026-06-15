// Demo users with regions
module.exports = [
  {
    username: 'admin',
    password: 'demo123',
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
  {
    username: 'americas_user',
    password: 'demo123',
    role: 'region',
    regions: ['AMERICAS'],
  },
];
