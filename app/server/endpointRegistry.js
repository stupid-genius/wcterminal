const registry = Object.freeze({
	openai: {
		protocol: 'https',
		host: 'openai.com',
		port: '443',
		path: '/api/v1/engines/gpt-3.5-turbo/completions',
		headers: {
			// 'accept': 'application/json',
			// 'content-type': 'application/json'
		},
		body: {
			'model': 'gpt-3.5-turbo',
			'prompt': '{{prompt}}',
			'max_tokens': 60,
			'temperature': 0.5,
			'top_p': 1,
			'frequency_penalty': 0,
			'presence_penalty': 0,
			'stop': ['\n']
		}
	}
});

module.exports = registry;
