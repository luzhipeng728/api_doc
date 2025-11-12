/**
 * PM2 生态系统配置文件
 * 用于管理 LLM API 文档项目的运行
 */

module.exports = {
  apps: [
    {
      name: 'llm-api-docs',                    // 应用名称
      script: 'npx',                           // 使用 npx 运行
      args: 'vitepress preview docs --port 6753', // 启动命令和参数
      cwd: './',                               // 工作目录
      instances: 1,                            // 实例数量
      exec_mode: 'fork',                       // 执行模式：fork 或 cluster
      watch: false,                            // 是否监听文件变化自动重启
      max_memory_restart: '500M',              // 内存超过 500M 时自动重启
      env: {
        NODE_ENV: 'production',                // 生产环境
        PORT: 6753                             // 端口号
      },
      error_file: './logs/error.log',          // 错误日志文件
      out_file: './logs/out.log',              // 输出日志文件
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z', // 日志日期格式
      merge_logs: true,                        // 合并日志
      autorestart: true,                       // 自动重启
      max_restarts: 10,                        // 最大重启次数
      min_uptime: '10s',                       // 最小运行时间
      listen_timeout: 10000,                   // 启动超时时间
      kill_timeout: 5000,                      // 强制杀死超时时间
    }
  ]
};
