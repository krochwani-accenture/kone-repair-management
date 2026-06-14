module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "/home/ec2-user/kone-repair-management",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};