var util                = require('util');
var findIdentifiers     = require('../components/find-identifiers');
// var findTwStatus        = require('../components/extractors/twitter-status-ids-extract');

var fs                  = require('fs');

// var text = '(и@ес.ли* 32 года,https://vk.com/asdf skype:lalalaPro то322-22-33/1233544 06/05/2015как (+7(999)444-1111)(7(999)444-2222)(8(999)444-3333)9993334444, 83831235533, 8-383-1235533, именно склонять Петров Петр Петрович Илья Павлович Сергей Васильевич? 5 апреля 6 апр 2016 2015-05-06 Именно с нимhttps://twitter.com/glencharnoch/status/723466741381255169 носители языка обращаютсяhttps://vk.com/id157750243/asd за https://vk.com/group157750243/asdпомощью https://vk.com/id157750243 к лингвистам. Hello@my Very Big world';
// var text = 'https://twitter.com/glencharnoch/status/723466741381255169';
var text = 'TopTicketShop.Ru (@TopTicketShopRu) билеты на Лигу Чемпионов УЕФА, билеты на ЧМ по хоккею 2015, Формула 1, билеты на ЕВРО-2016 +7 495 742-6499 http://t.co/DwKpKvsmcG http://t.co/dPuRhT7m3w Присоединился Thu Nov 24 11:12:59 +0000 2011 Часовой пояс: Moscow Последнее сообщение: #UEFAEURO2016 #БИЛЕТЫНАЕВРО2016 #ФРАНЦИЯ2016 #EURO2016 #ЕВРО2016 e@ma.il text hello Привет Мир! 2016 10 11 ЧТО За Человек! Игрок ФК Рубин и Сборной России. Обозреватель Спорт-Экспресс Дилан О\'Брайен Таймер Евро-2016 Футбол ЧЕ Мне понравилось видео "Николай Гринько - Футбол" лала АиФ Тула не понравилось видео "Режим "Танковый Футбол" в игре Wo «Ад Данте»  РПЦ. После';

// var text = fs.readFileSync('/home/vladimiralemasov/dev/html-test/vk.html', 'utf8');
// fs.writeFileSync('/home/vladimiralemasov/dev/html-test/vk_text.html', text, 'utf8');

var res = findIdentifiers(text);
// var res = findTwStatus.getItems(text);
// delete(res.markedText);
// console.dir(res);
console.log(util.inspect(res, {depth:4}));
// console.log(res.markedText);

var toFile = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" type="text/css" href="markup.css"></head><body>${text}<br><br><br>${res.markedText}</body></html>`;
fs.writeFileSync('/home/vladimiralemasov/dev/html-test/idf_test.html', toFile, 'utf8');

process.exit();