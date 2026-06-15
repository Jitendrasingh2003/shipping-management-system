// PM2 Ecosystem Configuration File
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      // ─── ShipTrack Pro — Node.js Backend ─────────────────────────────────
      name: 'shiptrack-server',
      script: './server.js',
      cwd: './server',

      // Process management
      instances: 'max',       // Use all available CPU cores (cluster mode)
      exec_mode: 'cluster',   // Enable load balancing across instances
      watch: false,           // Disable file watching in production

      // Memory management
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      min_uptime: '10s',        // Consider started if alive for 10s
      max_restarts: 10,         // Max restart attempts before giving up
      restart_delay: 4000,      // Wait 4s between restarts

      // Environment variables — Development
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },

      // Environment variables — Production
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        // MongoDB Atlas (set in .env.production)
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        CLIENT_URL: process.env.CLIENT_URL,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file:   './logs/pm2-out.log',
      log_file:   './logs/pm2-combined.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,      // Wait 5s for graceful shutdown
      wait_ready: true,        // Wait for process.send('ready')
      listen_timeout: 10000,   // Wait 10s for app to listen on port
    },
  ],

  // ─── Deployment Configuration ────────────────────────────────────────────
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],          // Replace with your server IP
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/shipping-management-system.git',
      path: '/var/www/shiptrack-pro',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --prefix server && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
