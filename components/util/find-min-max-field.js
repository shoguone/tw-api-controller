var longAdd     = require('./long-add').add;

module.exports = function (items, field) {
    if (items.length <= 0)
        return [];
	var min = items[items.length - 1][field];
	var max = items[0][field];
	
    /** 
     * Если порядок твитов известен, достаточно взять крайние записи; 
     * Иначе - вычисляем
     */
    if (field != 'itemId') {
        items.forEach(function (item)
        {
            if (item[field] > max)
            {
                max = item[field];
            }
            if (item[field] < min)
            {
                min = item[field];
            }
        });
    }
	
    var beforeMin = longAdd(min, -1);
	return [ beforeMin, max ];
};
