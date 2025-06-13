import { DifyAppStoreReadonly, IDifyAppItem } from '@dify-chat/core'
import { createDifyApiInstance } from '@dify-chat/api'

import { getStaticAppList } from './data'

// token 缓存的 key
const TOKEN_CACHE_KEY = 'xinchat-token'

/**
 * PassportCreate API 响应类型
 */
interface IPassportCreateResponse {
	access_token: string
}

/**
 * Token 缓存数据结构
 */
interface ITokenCache {
	version: number
	[appId: string]: {
		DEFAULT: string
	} | number
}



/**
 * 获取本地缓存的 token 数据
 */
function getTokenCache(): ITokenCache {
	try {
		const cached = localStorage.getItem(TOKEN_CACHE_KEY)
		return cached ? JSON.parse(cached) : { version: 2 }
	} catch (error) {
		console.error('解析 token 缓存失败:', error)
		return { version: 2 }
	}
}

/**
 * 保存 token 到本地缓存
 */
function saveTokenCache(cache: ITokenCache): void {
	try {
		localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cache))
	} catch (error) {
		console.error('保存 token 缓存失败:', error)
	}
}

/**
 * 为应用获取并缓存 passport token
 */
async function ensureAppPassportToken(app: IDifyAppItem): Promise<void> {
	const tokenCache = getTokenCache()
	console.log('!!!!!tokenCache:', tokenCache)
	
	// 如果已经有对应 appId 的 token，则跳过
	const existingToken = tokenCache[app.id]
	if (existingToken && typeof existingToken === 'object' && 'DEFAULT' in existingToken) {
		console.log(`应用 ${app.id} 的 token 已存在，跳过获取`)
		return
	}
	
	try {
		// 创建 API 实例
		const difyApi = createDifyApiInstance({
			user: 'default-user', // 使用默认用户
			...app.requestConfig,
		})
		
		// 调用 passportCreate API
		const response = await difyApi.passportCreate(app.id) as IPassportCreateResponse
		
		if (response && response.access_token) {
			// 更新缓存
			tokenCache[app.id] = {
				DEFAULT: response.access_token
			}
			
			// 保存到本地存储
			saveTokenCache(tokenCache)
			
			console.log(`成功为应用 ${app.id} 获取并缓存 token`)
		} else {
			console.warn(`应用 ${app.id} 的 passportCreate API 返回数据格式异常:`, response)
		}
	} catch (error) {
		console.error(`为应用 ${app.id} 获取 passport token 失败:`, error)
	}
}

/**
 * 应用列表的静态配置实现
 * 注意：**尽量不要在公开的生产环境中使用静态数据**，推荐使用后端服务
 */
class DifyAppService extends DifyAppStoreReadonly {
	public readonly = true as const

	async getApps(): Promise<IDifyAppItem[]> {
		return await getStaticAppList()
	}

	async getApp(id: string): Promise<IDifyAppItem | undefined> {
		const appList = await getStaticAppList()
		const app = appList.find(config => config.id === id)
		
		// 如果找到了应用，为这个应用获取并缓存 passport token
		if (app) {
			try {
				await ensureAppPassportToken(app)
				const tokenCache = getTokenCache()
				const appToken = tokenCache[app.id]
				if (appToken && typeof appToken === 'object' && 'DEFAULT' in appToken) {
					app.requestConfig.apiKey = appToken.DEFAULT
				}
			} catch (error) {
				console.error(`为应用 ${app.id} 获取 passport token 失败:`, error)
			}
		}

		
		return app
	}
}

export default DifyAppService
