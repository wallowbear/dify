export class BaseRequest {
	constructor(options: { baseURL: string }) {
		this.options = options
	}

	options: {
		baseURL: string
	}

	async baseRequest(url: string, options: RequestInit) {
		const result = await fetch(`${this.options.baseURL}${url}`, {
			...options,
		})
		return result
	}

	async jsonRequest(url: string, options: RequestInit) {
		const result = await this.baseRequest(url, {
			...options,
			headers: {
				...options.headers,
				'Content-Type': 'application/json',
			},
		})
		return result.json()
	}

	async get(
		url: string,
		params: Record<string, string> = {},
		headers: Record<string, string> = {},
	) {
		const queryString =
			params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''
		const result = await this.jsonRequest(`${url}${queryString}`, {
			method: 'GET',
			headers,
		})
		return result
	}

	async post(
		url: string,
		params: Record<string, unknown> = {},
		headers: Record<string, string> = {},
	) {
		const result = await this.jsonRequest(url, {
			method: 'POST',
			body: JSON.stringify(params),
			headers,
		})
		return result
	}

	async put(
		url: string,
		params: Record<string, unknown> = {},
		headers: Record<string, string> = {},
	) {
		const result = await this.jsonRequest(url, {
			method: 'PUT',
			body: JSON.stringify(params),
			headers,
		})
		return result
	}

	async delete(
		url: string,
		params: Record<string, unknown> = {},
		headers: Record<string, string> = {},
	) {
		const result = await this.baseRequest(url, {
			method: 'DELETE',
			body: JSON.stringify(params),
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
		})
		return result
	}
}
