var redisCache = require('express-redis-cache'),
  express = require('express'),
  app = express(),
  request = require('request');

var port = process.env.PORT || 4000;

var cache;
if(process.env.REDIS_HOST && process.env.REDIS_SECRET && process.env.REDIS_PORT){
  var options = {host: process.env.REDIS_HOST, auth_pass: process.env.REDIS_SECRET, port: process.env.REDIS_PORT};
  cache = redisCache(options);
} else {
  cache = redisCache();
}

app.get(/proxy\/api.github\.com\/*/i, cache.route({expire: {200: 10000, 404: 100, xxx: 1}}), function (req, res) {
  var originalUrl = req.originalUrl.replace(/^\/proxy\//i, '');
  delete req.headers['host'];
  if(process.env.GH_TOKEN) {
    req.headers['Authorization'] = 'token ' + process.env.GH_TOKEN;
  }
  request.get('https://' + originalUrl, {headers: req.headers}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      for(var key in response.headers){
        res.set(key, response.headers[key]);
      }
      res.set('Access-Control-Allow-Origin', '*');
      res.send(body);
    } else {
      if(error){
        res.status(500).send({error: error});
      } else {
        res.status(response.statusCode).send(response.body);
      }
    }
  });
});

app.listen(port, function () {
  console.log('app listening on port ' + port + '!');
});
