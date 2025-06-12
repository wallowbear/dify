import { DifyAppStoreReadonly, IDifyAppItem } from '@dify-chat/core'

import { getStaticAppList } from './data'

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
		return appList.find(config => config.id === id)
	}
}

export default DifyAppService
