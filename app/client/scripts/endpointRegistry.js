const registry = Object.freeze({
	jsonrpc: {
		url: '/terminal',
		method: 'post',
		headers: {
			'content-type': 'application/json'
		},
		body: {
			id: 1, // not sure how to use this
			method: '{{method}}',
			params: '{{params}}'
		}
	}
});

module.exports = registry;
