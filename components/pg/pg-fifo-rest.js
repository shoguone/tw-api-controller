var commonExpress		= require('../common/common-express');

var register = function (app, fifo) {
	app.post('/add', function (req, res) {
		fifo.add(req.body)
			.then(function (id) {
				res.json({ id: id });
			})
			.catch(function (err) {
                console.log(err);
				commonExpress.sendError(res, err);
			});
	});
	
	app.post('/remove', function (req, res) {
		var body = req.body;
		if (!body || !body.id) {
			commonExpress.sendError(res, 'Был передан пустой ID.');
			return;
		}
		
		fifo.remove(body.id)
			.then(function (success) {
				res.json({ success: success });
			})
			.catch(function (err) {
				commonExpress.sendError(res, err);
			});
	});
};


module.exports = {
	register: register
};
