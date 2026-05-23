module.exports = {
  apps: [{
    name: 'yiming-blog',
    script: 'server.tsx',
    interpreter: 'tsx',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    watch: false,
    max_memory_restart: '500M',
  }]
}