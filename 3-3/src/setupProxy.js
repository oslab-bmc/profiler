const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app){
  app.use(
      createProxyMiddleware('/fan', {
          target: 'http://203.253.25.207:9000',
          changeOrigin: true
      })
  )
};