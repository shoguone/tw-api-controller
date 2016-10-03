* Перед сборкой приложения установить:  `npm install -g pm2`
* Для сборки модулей зависимостей:  `npm install`
* Настройки `config.js`
* Для работы необходимо запустить `account-queue-run.js`, `api-rabbit-run.js` (`pm2 start start.json`; или по отдельности: `pm2 start start-account-queue.json`, `pm2 start start-rabbit.json`)
* Старт  `pm2 start start.json`
* Рестарт  `pm2 restart start.json`