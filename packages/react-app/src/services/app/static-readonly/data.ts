import { AppModeEnums, IDifyAppItem, DOMAINS, API_PATHS } from '@dify-chat/core'

/**
 * 静态的应用列表，用于演示
 * 注意：**尽量不要在公开的生产环境中使用静态数据**，推荐使用后端服务
 */
export const staticAppList: IDifyAppItem[] = [
	{
		id: 'RdWflQIhxnOryI4J',
		info: {
			name: '划划划',
			description: '划划划',
			tags: [],
			mode: AppModeEnums.CHATFLOW,
		},
		requestConfig: {
			apiBase: `${DOMAINS.URL}${API_PATHS.V1}`,
			apiKey: 'app-BkFKoValB0qF1Z5ElqHMdMqu',
		},
	},
	{
		id: 'ZJLZ9W5A46RyojVq',
		info: {
			name: '图表模板',
			description: '图表模板',
			tags: [],
			mode: AppModeEnums.CHATFLOW,
		},
		requestConfig: {
			apiBase: `${DOMAINS.URL}${API_PATHS.V1}`,
			apiKey: 'app-96iozMGy0tgwYXdTtoLUDM5G',
		},
	},
	{
		id: 'NXu2Zvi5IWyoDKOq',
		info: {
			name: 'AI功能地图',
			description: 'AI功能地图',
			tags: [],
			mode: AppModeEnums.CHATFLOW,
		},
		requestConfig: {
			apiBase: `${DOMAINS.URL}${API_PATHS.V1}`,
			apiKey: 'app-pLRTyNFSldXn17PWucUB55Lr',
		},
	}
]
