var rabbitWorker    = require('./components/rabbit/worker');

rabbitWorker.handleQueue();

console.log('Сервер запущен');