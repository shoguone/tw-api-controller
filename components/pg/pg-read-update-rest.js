var _					= require('underscore');
var commonExpress		= require('../common/common-express');

var PgGenericDao        = require('../../infrastructure/pg-generic-dao');

var register = function (app, connStr, tableName)
{
    app.post('/update', function (req, res)
    {
        // req.body ~ entity to update
        var query = 
            'UPDATE "' + tableName + '" '
            + 'SET ';
        var clause = ' WHERE "id" = $1';
        
        var compileQuery = function (entity)
        {
            var queryEnding = '';
            var i = 1;
            if (entity.id)
            {
                i++;
                queryEnding = clause;
            }
            var arr = [];
            for (var property in entity)
            {
                if (property != 'id')
                {
                    arr.push('"' + property + '" = $' + i);
                    i++;
                }
            }
            return query + arr.join(', ') + queryEnding;
        };

		if (_.isObject(req.body))
        {
            var entity = req.body;
            var updateQuery = compileQuery(entity);
            var params = [];
            for (var property in entity)
            {
                params.push(entity[property]);
            }
            PgGenericDao.rawExec(connStr, updateQuery, params)
                .then(function (data)
                {
                    res.json({});
                    res.end();
                })
                .catch(function (err)
                {
                    var er = {
                        err : err,
                        msg : 'Ошибка при обновлении задачи',
                        query : updateQuery,
                        params : params
                    };
                    commonExpress.sendError(res, er);
                });
        }
		else
        {
			// console.log('Запрос невалиден');
			commonExpress.sendError(res, 'Некорректный запрос, ожидался объект entity.');
		}
    });

    app.post('/read', function (req, res)
    {
        // req.body ~ [ key, value ]
		if (req.body
            && _.isArray(req.body)
            && req.body[0]
            && req.body[1])
        {
            var key = req.body[0];
            var value = req.body[1];
            var query = 'SELECT * '
                + 'FROM "' + tableName + '" '
                + 'WHERE "' + key + '" = $1';
            var params = [ value ];
            PgGenericDao.rawExec(connStr, query, params)
                .then(function (data)
                {
                    res.json(data.rows[0]);
                    res.end();
                })
                .catch(function (err)
                {
                    commonExpress.sendError(res, err);
                });
            
        }
		else
        {
			// console.log('Запрос невалиден');
			commonExpress.sendError(res, 'Некорректный запрос, ожидался массив [ key, value ].');
		}
    });
};

module.exports = {
    register: register
};