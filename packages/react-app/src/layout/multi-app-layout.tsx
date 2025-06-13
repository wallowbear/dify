import { DownCircleTwoTone } from '@ant-design/icons'
import { createDifyApiInstance, DifyApi } from '@dify-chat/api'
import { LucideIcon } from '@dify-chat/components'
import {
	AppContextProvider,
	ICurrentApp,
	IDifyAppItem,
	IDifyChatContextMultiApp,
} from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useIsMobile } from '@dify-chat/helpers'
import { useMount, useRequest } from 'ahooks'
import { Dropdown, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

import { useAppSiteSetting } from '@/hooks/useApi'

import MainLayout from './main-layout'

const MultiAppLayout: React.FC = () => {
	const { ...difyChatContext } = useDifyChat()
	const { user, appService } = difyChatContext as IDifyChatContextMultiApp
	const navigate = useNavigate()

	const [difyApi] = useState(
		createDifyApiInstance({
			user,
			apiBase: '',
			apiKey: '',
		}),
	)

	const [selectedAppId, setSelectedAppId] = useState<string>('')
	const [initLoading, setInitLoading] = useState(false)
	const [appList, setAppList] = useState<IDifyAppItem[]>([])

	const { appId } = useParams<{ appId: string }>()
	const [currentApp, setCurrentApp] = useState<ICurrentApp>()

	const { runAsync: getAppList } = useRequest(
		() => {
			setInitLoading(true)
			return appService.getApps()
		},
		{
			manual: true,
			onSuccess: async (result) => {
				
				if (isMobile) {
					// 移动端如果没有应用，直接跳转应用列表页
					if (!result?.length) {
						navigate('/apps', { replace: true })
						return Promise.resolve([])
					}
				}

				const updatedResult = [...result]

				if (appId) {
					const appData = await appService.getApp(appId as string)
					setSelectedAppId(appId as string)
					// 更新result中对应的app数据
					const index = updatedResult.findIndex(item => item.id === appId)
					if (index !== -1 && appData) {
						updatedResult[index] = { ...updatedResult[index], ...appData }
					}
				} else if (!selectedAppId && result?.length) {
					const appData = await appService.getApp(result[0]?.id as string)
					setSelectedAppId(result[0]?.id || '')
					// 更新result中对应的app数据
					if (appData) {
						updatedResult[0] = { ...updatedResult[0], ...appData }
					}
				}

				flushSync(() => {
					setAppList(updatedResult)
				})
			},
			onError: error => {
				message.error(`获取应用列表失败: ${error}`)
				console.error(error)
			},
		},
	)

	const { runAsync: getAppParameters } = useRequest(
		(difyApi: DifyApi) => {
			return difyApi.getAppParameters()
		},
		{
			manual: true,
		},
	)

	const { getAppSiteSettting } = useAppSiteSetting()

	/**
	 * 初始化应用信息
	 */
	const initApp = async () => {
		const appItem = appList?.find(item => item.id === selectedAppId)
		console.log('appItem', appItem)
		if (!appItem) {
			return
		}
		difyApi.updateOptions({
			user,
			...appItem.requestConfig,
		})
		setInitLoading(true)
		// 获取应用参数
		const getParameters = () => getAppParameters(difyApi)
		const getSiteSetting = () => getAppSiteSettting(difyApi)
		const promises = [getParameters(), getSiteSetting()] as const
		Promise.all(promises)
			.then(res => {
				const [parameters, siteSetting] = res
				console.log('更新一下', appItem)
				setCurrentApp({
					config: appItem,
					parameters: parameters!,
					site: siteSetting,
				})
			})
			.catch(err => {
				message.error(`获取应用参数失败: ${err}`)
				console.error(err)
				setCurrentApp(undefined)
			})
			.finally(() => {
				setInitLoading(false)
			})
	}

	useEffect(() => {
		initApp()
	}, [selectedAppId])

	const isMobile = useIsMobile()

	// 初始化获取应用列表
	useMount(() => {
		getAppList()
	})

	return (
		<AppContextProvider
			value={{
				appLoading: initLoading,
				currentAppId: selectedAppId,
				setCurrentAppId: setSelectedAppId,
				currentApp,
				setCurrentApp,
			}}
		>
			<MainLayout
				difyApi={difyApi}
				initLoading={initLoading}
				renderCenterTitle={() => {
					return (
						<div className="flex items-center overflow-hidden">
							<LucideIcon
								name="layout-grid"
								size={16}
								className="mr-1"
							/>
							<span
								className="cursor-pointer inline-block shrink-0"
								onClick={() => {
									navigate('/apps')
								}}
							>
								应用列表
							</span>
							{selectedAppId ? (
								<div className="flex items-center overflow-hidden">
									<div className="mx-2 font-normal text-desc">/</div>
									<Dropdown
										arrow
										placement="bottom"
										trigger={['click']}
										menu={{
											selectedKeys: [selectedAppId],
											items: [ 
												...(appList?.map(item => {
													const isSelected = selectedAppId === item.id
													return {
														key: item.id,
														label: (
															<div className={isSelected ? 'text-primary' : 'text-theme-text'}>
																{item.info.name}
															</div>
														),
														onClick: () => {
															navigate(`/app/${item.id}`)
															setSelectedAppId(item.id)
														},
														icon: (
															<LucideIcon
																name="bot"
																size={18}
															/>
														),
													}
												}) || []),
											],
										}}
									>
										<div className="cursor-pointer flex-1 flex items-center overflow-hidden">
											<span className="cursor-pointer w-full inline-block truncate">
												{currentApp?.config?.info?.name}
											</span>
											<DownCircleTwoTone className="ml-1" />
										</div>
									</Dropdown>
								</div>
							) : null}
						</div>
					)
				}}
			/>
		</AppContextProvider>
	)
}

export default MultiAppLayout
