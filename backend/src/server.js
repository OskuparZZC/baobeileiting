/**
 * HTTP 服务器启动入口
 */

const app = require('./app');
const config = require('./config');
const { testConnection } = require('./config/database');

async function start() {
  // 测试数据库连接（当前为内存模式）
  await testConnection();

  // 启动服务
  const server = app.listen(config.port, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║       🍵  爆杯雷霆 V2.1 后端服务         ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  环境:     ${config.nodeEnv.padEnd(27)}║`);
    console.log(`║  端口:     ${String(config.port).padEnd(27)}║`);
    console.log(`║  存储:     内存模式 (Phase 6 → MySQL)    ║`);
    console.log(`║  健康检查: http://localhost:${config.port}/api/health ║`);
    console.log('╚══════════════════════════════════════════╝');
  });

  // 优雅关闭
  const shutdown = (signal) => {
    console.log(`\n[Server] 收到 ${signal} 信号，正在关闭服务...`);
    server.close(() => {
      console.log('[Server] 服务已关闭');
      process.exit(0);
    });
    // 10 秒强制退出
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('[Server] 启动失败:', err);
  process.exit(1);
});
