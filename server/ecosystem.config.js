// pm2 process definition — `pm2 start ecosystem.config.js`
module.exports = {
  apps: [
    {
      name: 'agrosmart',
      cwd: __dirname,
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      time: true
    }
  ]
}
