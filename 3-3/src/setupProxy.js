const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app){
  app.use(
      createProxyMiddleware('/fan', {
          target: 'http://192.168.0.4:8000',
          changeOrigin: true
      })
  )
};