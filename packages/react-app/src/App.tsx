import { DifyChatProvider } from '@dify-chat/core'
import { initResponsiveConfig } from '@dify-chat/helpers'
import { useThemeContext } from '@dify-chat/theme'
import FingerPrintJS from '@fingerprintjs/fingerprintjs'
import { useMount } from 'ahooks'
import { theme as antdTheme, ConfigProvider } from 'antd'
import { HashRouter } from 'react-router-dom'
import { useState } from 'react'

import './App.css'
import LayoutIndex from './layout'
import DifyAppService from './services/app/static-readonly'

// 初始化响应式配置
initResponsiveConfig()

/**
 * Dify Chat 的最小应用实例
 */
export default function App() {
	const [userId, setUserId] = useState<string>('')

	useMount(() => {
		// 模拟登录过程获取用户唯一标识
		const loadFP = async () => {
			const fp = await FingerPrintJS.load()
			const result = await fp.get()
			setUserId(result.visitorId)
		}
		loadFP()
	})

	const { isDark } = useThemeContext()

	return (
		<ConfigProvider
			theme={{
				algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
			}}
		>
			<HashRouter>
				<DifyChatProvider
					value={{
						mode: 'multiApp',
						user: userId,
						// 默认使用 localstorage, 如果需要使用其他存储方式，可以实现 DifyAppStore 接口后传入，异步接口实现参考 src/services/app/restful.ts
						appService: new DifyAppService(),
						enableSetting: true,
					}}
				>
					<LayoutIndex />
				</DifyChatProvider>
			</HashRouter>
		</ConfigProvider>
	)
}
