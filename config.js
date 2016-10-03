module.exports = {
    serviceShortName: 'tw',
    siteUrl: 'http://twitter.com/',
    api: {
        rest: {
            port: 5050,
            clientBaseUrl: 'http://127.0.0.1:5050',
            getPreviewsPath: '/getPreviews'
        },
        bus: {
            connStr: 'amqp://subnet:Qawzse123@172.16.71.248',
            // connStr: 'amqp://localhost',
            commonQueue: 'request.tw'
        },
        methods: {
            getPreviews: 'getPreviews',
            getContent: 'getContent',
            getContentByQuery: 'getContentByQuery',
            getPostSpreading: 'getPostSpreading'
        },
        formatAuthorUrl: screenName => `https://twitter.com/${screenName}/`,
        formatPostUrl: (screenName, postId) => `https://twitter.com/${screenName}/status/${postId}`,
        reUrlSearch: new RegExp('^https?://twitter\.com/search\\?(?:f=(.*?)&)?.*q=([^&]+).*?$'),
        reUrlText: new RegExp('^https?://twitter\.com/.+?/status/(\\d+)$'),
        reUrlAuthor: new RegExp('^https?://twitter\.com/(.+?)/$'),
        /**
         * Количество попыток выполнения метода (напр. getPreviews)
         * (Если в цепочке выполнение метода окончилось ошибкой, 
         * то предпринимаем попытку его выполнения столько раз) 
         */
        maxRequestAttempts: 3,
        /**
         * Если contentTypes не указан или если указан пустой массив, 
         * то принимаем данное значение по умолчанию
         */
        defaultContentTypes: ['user', 'post'],
        /**
         * Типы контента, "известные" Контроллеру
         */
        familiarContentTypes: {
            user: 'user',
            post: 'post'
        },
        constraints: {
            post: {
                /** Максимальное количество ретвитов, выводимых в contentHtml */
                maxRetweetsInHtml: 20

            },
            user: {
                /** Сколько возвращать сообщений из ленты юзера при getContent */
                timelineLimit: 20
            }
        }
    },
    
	accountQueueServer: {
		port: 5009,
		clientBaseUrl: 'http://127.0.0.1:5009',
		connectionString: 'postgres://twadmin:Qawzse123@localhost:5432/twadmin',
		tableName: 'accounts'
	},
	
    twitterApi: {
        /** максимальное количество результатов, которое можно указать в запросе search/tweets */
        searchTweetsMax: 100,
        /** минимальное количество результатов, которое будем указывать в search/tweets, чтобы не ковырять по одному */
        searchTweetsMin: 100,
        /** максимальное количество результатов, которое можно указать в запросе users/search */
        usersSearchMax: 20,
        /** максимальная длина запроса */
        maxQueryLength: 130
    },
    
    /** 24*60*60*1000 */
    msInDay: 86400000,

    analytics: {
        // requestQueue: 'request.analytics',
        requestQueue: 'request.analytics.dev',
        methods: {
            unshortenUrls: 'unshortenUrls',
            findIdentifiers: 'findIdentifiers'
        }
    }
};