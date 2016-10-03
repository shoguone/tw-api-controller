var util                = require('util');

var PgGenericDao        = require('../../infrastructure/pg-generic-dao');
var pgQueryExtender     = require('../../infrastructure/pg-query-extender');
var Promise		        = require('promise');


var PgFIFO = function (connStr, tableName, fields) {
    var fifoFields = [ 'id', 'queueTime' ];
    fields.forEach(function (it) {
        fifoFields.push(it);
    });
    
	this._connStr = connStr;
    this._tableName = tableName;
    this._fields = fifoFields;
};

PgFIFO.prototype.clear = function () {
	var promise = PgGenericDao.delete(this._connStr, this._tableName);    
    return promise;
};

PgFIFO.prototype.add = function (item) {
    var self = this;
    item.queueTime = new Date();
    
    return new Promise(function (resolve, reject) {
        PgGenericDao
            .insert(self._connStr, self._tableName, item, 'id')
            .then(function (item) {
                resolve(item.id);
            })
            .catch(function (err) {
                reject(err);
            });      
    });
};

PgFIFO.prototype.remove = function (id) {
    var self = this;
    
    return new Promise(function (resolve, reject) {
        PgGenericDao
            .delete(self._connStr, self._tableName, [ 'id', '=', id ])
            .then(function (result) {
                resolve(result.rowCount);
            })
            .catch(function (err) {
                reject(err);
            });        
    });
};

PgFIFO.prototype.getNext = function (filter) {
    var self = this;
    
    return new Promise(function (resolve, reject) {
        var params = [ new Date() ];
        var queryFirst = 
            'SELECT MIN("queue_time") ' 
            + 'FROM "' + self._tableName + '" '
            + 'WHERE "in_progress" = FALSE';
        if (filter)
        {
            var filterIndex = params.length + 1;
            var filterClause = pgQueryExtender.createFilterByClause(filter, null, filterIndex);
            queryFirst += ' AND ' + filterClause.query;
            filterClause.params.forEach(function(param)
            {
                params.push(param);
            });
        }
        var query =
            'UPDATE "' + self._tableName + '" '
            + 'SET "queue_time" = $1, '
            + '"in_progress" = TRUE '
            + 'WHERE "id" = '
                + '('
                    + 'SELECT "id" '
                    + 'FROM "' + self._tableName + '" '
                    + 'WHERE "queue_time" = ('
                        + queryFirst 
                    + ') '
                    + 'ORDER BY "id" DESC '
                    + 'LIMIT 1 '
                + ')'
            + 'RETURNING "id"';
        
        PgGenericDao.rawExec(
            self._connStr,
            query,
            params
        )
        .then(function (result) {
            if (result.rows.length) {
                PgGenericDao.queryByFields(
                    self._connStr,
                    self._tableName,
                    self._fields,
                    [ 'id', '=', result.rows[0].id ]
                )
                .then(function (items) {
                    if (items.length) {
                        resolve(items[0]);
                    }
                    else {
                        reject(null);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
            }
            else {
                resolve(null);
            }
        })
        .catch(function (err) {
            reject(err);
        });    
    });
};

PgFIFO.prototype.count = function () {
    var self = this;
    
    return new Promise(function (resolve, reject) {
        var query = 'SELECT COUNT(*) as "count" FROM "' + self._tableName + '"';
        PgGenericDao
            .rawTransformedQuery(self._connStr, query)
            .then(function (data) {
                resolve(data[0].count);
            })
            .catch(function (err) {
                reject(err);
            });        
    });
};


module.exports = {
	PgFIFO: PgFIFO
};
