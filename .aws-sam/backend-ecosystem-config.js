module.exports = {
  apps: [
    {
      name: "backend",
      script: "./backend/server.js",
      cwd: "/home/ec2-user/kone-repair-management",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "product  ion",
        PORT: 5000
      }
    }
  ]
};