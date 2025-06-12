import { AppModeEnums, IDifyAppItem, DOMAINS, API_PATHS } from '@dify-chat/core'

/**
 * API响应数据类型定义
 */
interface ApiResponseItem {
	guid: string
	agentName: string
	agentDesc: string
	agentPrompt: string
	agentType: string
	agentUrl: string
	agentIcon: string
	agentComponent: string
	createTime: number
	updateTime: number
	deleteFlag: string
	resourceCode: string
}

interface ApiResponse {
	isSuccess: boolean
	statusCode: number
	message: string
	jwt: string
	data: ApiResponseItem[]
}

/**
 * 扩展的IDifyAppItem类型，包含额外的API数据
 */
interface ExtendedIDifyAppItem extends IDifyAppItem {
	/**
	 * 额外的API数据
	 */
	extraData?: {
		guid: string
		agentPrompt: string
		agentType: string
		agentUrl: string
		agentIcon: string
		agentComponent: string
		createTime: number
		updateTime: number
		deleteFlag: string
		resourceCode: string
	}
}

/**
 * 静态的应用列表数据（备用数据）
 * 注意：**尽量不要在公开的生产环境中使用静态数据**，推荐使用后端服务
 */
const staticAppListData: IDifyAppItem[] = [
	{
		id: 'RdWflQIhxnOryI4J',
		info: {
			name: '写死的划划划',
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

/**
 * 从agentUrl中提取ID
 * @param agentUrl 代理URL，如：/special/ai/chatbot/pKkGkA5i7e2onowW
 * @returns 提取的ID，如：pKkGkA5i7e2onowW
 */
function extractIdFromAgentUrl(agentUrl: string): string {
	const segments = agentUrl.split('/')
	return segments[segments.length - 1] || ''
}

/**
 * 将API响应数据转换为IDifyAppItem格式
 * @param apiData API响应的单个数据项
 * @returns ExtendedIDifyAppItem格式的数据
 */
function transformApiDataToAppItem(apiData: ApiResponseItem): ExtendedIDifyAppItem {
	const id = extractIdFromAgentUrl(apiData.agentUrl)
	
	return {
		id,
		info: {
			name: apiData.agentName || '未命名应用',
			description: apiData.agentDesc || '',
			tags: [],
			mode: AppModeEnums.CHATFLOW,
		},
		requestConfig: {
			apiBase: `${DOMAINS.URL}${API_PATHS.V1}`,
			apiKey:'app-pLRTyNFSldXn17PWucUB55Lr', // 先写死测试一下
		},
		// 将额外信息存储在extraData中
		extraData: {
			guid: apiData.guid,
			agentPrompt: apiData.agentPrompt,
			agentType: apiData.agentType,
			agentUrl: apiData.agentUrl,
			agentIcon: apiData.agentIcon,
			agentComponent: apiData.agentComponent,
			createTime: apiData.createTime,
			updateTime: apiData.updateTime,
			deleteFlag: apiData.deleteFlag,
			resourceCode: apiData.resourceCode,
		},
	}
}

/**
 * 从iframe父窗口获取数据的Promise包装
 * @returns Promise<ApiResponse | null> 父窗口返回的数据或null
 */
function requestDataFromParent(): Promise<ApiResponse | null> {
	return new Promise((resolve) => {
		// 生成唯一的请求ID
		const requestId = `app-data-request-${Date.now()}-${Math.random()}`
		
		// 监听父窗口的回复
		function handleMessage(event: MessageEvent) {
			// 检查消息是否是对应的回复
			if (event.data && event.data.type === 'APP_DATA_RESPONSE' && event.data.requestId === requestId) {
				window.removeEventListener('message', handleMessage)
				resolve(event.data.data || null)
			}
		}
		
		window.addEventListener('message', handleMessage)
		
		// 向父窗口发送数据请求
		if (window.parent && window.parent !== window) {
			window.parent.postMessage({
				type: 'APP_DATA_REQUEST',
				requestId: requestId,
				timestamp: Date.now()
			}, '*')
		}
		
		// 设置超时，避免无限等待
		setTimeout(() => {
			window.removeEventListener('message', handleMessage)
			resolve(null)
		}, 5000) // 5秒超时
	})
}

/**
 * 轮询获取父窗口数据
 * @param maxAttempts 最大尝试次数，默认50次
 * @param interval 轮询间隔（毫秒），默认1000ms
 * @returns Promise<ApiResponse | null> 获取到的数据或null
 */
async function pollDataFromParent(maxAttempts: number = 50, interval: number = 1000): Promise<ApiResponse | null> {
	console.log('开始从父窗口轮询获取应用数据...')
	
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		console.log(`第 ${attempt} 次尝试获取父窗口数据...`)
		
		try {
			const data = await requestDataFromParent()
			
			if (data && data.isSuccess && Array.isArray(data.data)) {
				console.log('成功从父窗口获取到数据:', data)
				return data
			}
			
			console.log(`第 ${attempt} 次尝试未获取到有效数据，${interval}ms后重试...`)
		} catch (error) {
			console.warn(`第 ${attempt} 次尝试获取数据时发生错误:`, error)
		}
		
		// 如果不是最后一次尝试，则等待后重试
		if (attempt < maxAttempts) {
			await new Promise(resolve => setTimeout(resolve, interval))
		}
	}
	
	console.warn(`轮询结束，共尝试 ${maxAttempts} 次，未能获取到父窗口数据`)
	return null
}

/**
 * 异步获取应用列表数据
 * @returns Promise<IDifyAppItem[]> 应用列表
 */
export async function getStaticAppList(): Promise<IDifyAppItem[]> {
	try {
		// 检查是否在iframe中
		const isInIframe = window.self !== window.top
		
		if (isInIframe) {
			console.log('检测到在iframe中，尝试从父窗口获取数据...')
			
			// 从父窗口轮询获取数据
			const apiResponse = await pollDataFromParent()
			
			if (apiResponse && apiResponse.isSuccess && Array.isArray(apiResponse.data)) {
				// 转换API数据为IDifyAppItem格式
				const transformedData = apiResponse.data.map(transformApiDataToAppItem)
				console.log('transformedData:', transformedData)
				return transformedData
			}
			
			console.warn('从父窗口获取数据失败，使用备用静态数据')
		} else {
			console.log('不在iframe中，使用备用静态数据')
		}
		
		// 返回备用静态数据
		return staticAppListData
	} catch (error) {
		console.error('获取应用列表失败:', error)
		// 发生错误时返回备用静态数据
		return staticAppListData
	}
}
