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
				'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZDFmN2IxMmQtYTdhZi00NjM4LWE2NDMtYzAyNzVhZTVmYjAwIiwiZXhwIjoxNzQ5MDA1ODE4LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.sPmfGy2tNPxvoVnZdAySzJVxOL6kkmlt1WRiI3aYzo8',
				'Bwhr-Token': 'eyJhbGciOiJSUzI1NiJ9.eyJqdGkiOiI5NDkyZDk2NC1hNzQ4LTRhOTctODU5Mi1iNzAyNzQ1ODNiNmUiLCJzdWIiOiIyMVdYMTEyIiwidXNlcklwIjoiMTAuMjUuMjI3LjE0OCIsInVzZXJOYW1lIjoi56qm5Lqa546yKOi_kOe7tOi0puWPtykiLCJocmFyZWFDb2RlIjoiMTAwMDAwMDAwMDAwMDAwMDAwMDAwIiwiaHJhcmVhTmFtZSI6IuS4reWbveWuneatpumSoumTgembhuWbouaciemZkOWFrOWPuCIsImN1cnJlbnRPcmdDb2RlIjoiQlNUQSIsImN1cnJlbnRPcmdOYW1lIjoi5Lit5Zu95a6d5q2m6ZKi6ZOB6ZuG5Zui5pyJ6ZmQ5YWs5Y-4IiwiYXBwQ29kZSI6IkJXSFIiLCJ0ZW5hbnRDb2RlIjoiQlNUQSIsInJvb3RPcmdDb2RlIjoiQlNUQSIsInRva2VuQ3JlYXRlVGltZSI6MTc0OTAwMjIwNzI4Nn0.HXly1Bot1uj2qUHfCPRqnLATp7g6VPVKGrIQyGxDesueWypT5M-IYl_6Zxq18nkZ1uIs5BumAhfZLHSqcNI_pQ',
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
