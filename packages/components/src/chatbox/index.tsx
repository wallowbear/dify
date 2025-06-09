import { ArrowRightOutlined } from '@ant-design/icons'
import { Bubble, Prompts } from '@ant-design/x'
import { DifyApi, IFile, IMessageItem4Render } from '@dify-chat/api'
import { OpeningStatementDisplayMode, Roles, useAppContext } from '@dify-chat/core'
import { isTempId, useIsMobile } from '@dify-chat/helpers'
import { useThemeContext } from '@dify-chat/theme'
import { FormInstance, GetProp, message } from 'antd'
import { useDeferredValue, useEffect, useMemo, useRef } from 'react'

import LucideIcon from '../lucide-icon'
import { MessageSender } from '../message-sender'
import { validateAndGenErrMsgs } from '../utils'
import AppIcon from './app-icon'
import MessageContent from './message/content'
import MessageFooter from './message/footer'
import { WelcomePlaceholder } from './welcome-placeholder'

export interface ChatboxProps {
	/**
	 * 消息列表
	 */
	messageItems: IMessageItem4Render[]
	/**
	 * 是否正在请求
	 */
	isRequesting: boolean
	/**
	 * 下一步问题建议
	 */
	nextSuggestions: string[]
	/**
	 * 推荐 Item 点击事件
	 */
	onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'>
	/**
	 * 内容提交事件
	 * @param value 问题-文本
	 * @param files 问题-文件
	 */
	onSubmit: (
		value: string,
		options?: {
			files?: IFile[]
			inputs?: Record<string, unknown>
		},
	) => void
	/**
	 * 取消读取流
	 */
	onCancel: () => void
	/**
	 * 对话 ID
	 */
	conversationId: string
	/**
	 * 反馈执行成功后的回调
	 */
	feedbackCallback?: (conversationId: string) => void
	/**
	 * Dify API 实例
	 */
	difyApi: DifyApi
	/**
	 * 反馈 API
	 */
	feedbackApi: DifyApi['feedbackMessage']
	/**
	 * 上传文件 API
	 */
	uploadFileApi: DifyApi['uploadFile']
	/**
	 * 表单是否填写
	 */
	isFormFilled: boolean
	/**
	 * 表单填写状态改变回调
	 */
	onStartConversation: (formValues: Record<string, unknown>) => void
	/**
	 * 应用入参表单实例
	 */
	entryForm: FormInstance<Record<string, unknown>>
}

/**
 * 对话内容区
 */
export const Chatbox = (props: ChatboxProps) => {
	const {
		messageItems,
		isRequesting,
		nextSuggestions,
		onPromptsItemClick,
		onSubmit,
		onCancel,
		conversationId,
		feedbackCallback,
		difyApi,
		isFormFilled,
		onStartConversation,
		entryForm,
	} = props
	const isMobile = useIsMobile()
	const { currentApp } = useAppContext()
	const { isDark } = useThemeContext()
	const aiIcon = currentApp?.site?.use_icon_as_answer_icon ? (
		<AppIcon hasContainer />
	) : (
		<LucideIcon
			name="bot"
			size={18}
		/>
	)

	const roles: GetProp<typeof Bubble.List, 'roles'> = {
		ai: {
			placement: 'start',
			avatar: !isMobile
				? {
						icon: aiIcon,
						style: {
							background: isDark ? 'transparent' : '#fde3cf',
							// opacity: 0.9,
							border: isDark ? '1px solid var(--theme-border-color)' : 'none',
							color: isDark ? 'var(--theme-text-color)' : '#666',
						},
					}
				: undefined,
			style: isMobile
				? undefined
				: {
						// 减去一个头像的宽度
						maxWidth: 'calc(100% - 44px)',
					},
		},
		user: {
			placement: 'end',
			avatar: !isMobile
				? {
						icon: (
							<LucideIcon
								name="user"
								size={18}
							/>
						),
						style: {
							background: '#87d068',
						},
					}
				: undefined,
			style: isMobile
				? undefined
				: {
						// 减去一个头像的宽度
						maxWidth: 'calc(100% - 44px)',
						marginLeft: '44px',
					},
		},
	}

	const items: GetProp<typeof Bubble.List, 'items'> = useMemo(() => {
		return messageItems?.map(messageItem => {
			return {
				key: `${messageItem.id}-${messageItem.role}`,
				// 不要开启 loading 和 typing, 否则流式会无效
				// loading: status === 'loading',
				content: messageItem.content,
				messageRender: () => {
					return (
						<MessageContent
							onSubmit={onSubmit}
							messageItem={messageItem}
						/>
					)
				},
				// 用户发送消息时，status 为 local，需要展示为用户头像
				role: messageItem.role === Roles.LOCAL ? Roles.USER : messageItem.role,
				footer: messageItem.role === Roles.AI && (
					<div className="flex items-center">
						<MessageFooter
							ttsConfig={currentApp?.parameters?.text_to_speech}
							feedbackApi={params => difyApi.feedbackMessage(params)}
							ttsApi={params => difyApi.text2Audio(params)}
							messageId={messageItem.id}
							messageContent={messageItem.content}
							feedback={{
								rating: messageItem.feedback?.rating,
								callback: () => {
									feedbackCallback?.(conversationId!)
								},
							}}
							isRequesting={isRequesting}
							onRegenerateMessage={() => {
								// 直接通过遍历找到当前消息的用户子消息，取其内容发送消息
								const currentItem = messageItems.find(item => item.id === messageItem.id)
								if (!currentItem) {
									console.error('消息不存在:', messageItem.id)
									message.error('消息不存在')
									return
								}
								onSubmit(currentItem.content, {
									inputs: entryForm.getFieldsValue(),
								})
							}}
						/>
						{messageItem.created_at && (
							<div className="ml-3 text-sm text-desc">回复时间：{messageItem.created_at}</div>
						)}
					</div>
				),
			}
		}) as GetProp<typeof Bubble.List, 'items'>
	}, [
		messageItems,
		conversationId,
		difyApi,
		feedbackCallback,
		currentApp?.parameters,
		onSubmit,
		isRequesting,
		entryForm,
	])

	// 监听 items 更新，滚动到最底部
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	// 延迟更新，优化性能
	const deferredItems = useDeferredValue(items)
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				behavior: 'smooth',
				top: scrollContainerRef.current.scrollHeight,
			})
		}
	}, [deferredItems])

	// 获取应用的对话开场白展示模式
	const openingStatementMode =
		currentApp?.config?.extConfig?.conversation?.openingStatement?.displayMode

	// 是否展示开场白
	const promptsVisible = useMemo(() => {
		if (openingStatementMode === OpeningStatementDisplayMode.Always) {
			return true
		}
		return !items?.length && isTempId(conversationId)
	}, [openingStatementMode, items, conversationId])

	return (
		<div className="w-full h-full overflow-hidden my-0 mx-auto box-border flex flex-col gap-4 relative">
			<div
				className="w-full h-full overflow-auto pt-4 pb-48"
				ref={scrollContainerRef}
			>
				{/* 🌟 欢迎占位 + 对话参数 */}
				<WelcomePlaceholder
					showPrompts={promptsVisible}
					onPromptItemClick={onPromptsItemClick}
					formFilled={isFormFilled}
					onStartConversation={onStartConversation}
					conversationId={conversationId}
					entryForm={entryForm}
					uploadFileApi={(...params) => difyApi.uploadFile(...params)}
				/>

				<div className="flex-1 w-full md:!w-[90%] mx-auto px-3 md:px-0 box-border">
					{/* 🌟 消息列表 */}
					<Bubble.List
						items={items}
						roles={roles}
					/>

					{/* 下一步问题建议 当存在消息列表，且非正在对话时才展示 */}
					{nextSuggestions?.length && items.length && !isRequesting ? (
						<div className="p-3 md:pl-[44px] mt-3">
							<div className="text-desc">🤔 你可能还想问:</div>
							<div>
								{nextSuggestions?.map(item => {
									return (
										<div
											key={item}
											className="mt-3 flex items-center"
										>
											<div
												className="p-2 shrink-0 cursor-pointer rounded-lg flex items-center border border-solid border-theme-border text-sm max-w-full text-theme-desc"
												onClick={() => {
													onPromptsItemClick({
														data: {
															key: item,
															description: item,
														},
													})
												}}
											>
												<span className="truncate">{item}</span>
												<ArrowRightOutlined className="ml-1" />
											</div>
										</div>
									)
								})}
							</div>
						</div>
					) : null}
				</div>

				<div
					className="absolute bottom-0 bg-theme-main-bg w-full md:!w-[90%] left-1/2"
					style={{
						transform: 'translateX(-50%)',
					}}
				>
					{/* 🌟 输入框 */}
					<div className="px-3">
						<MessageSender
							onSubmit={async (...params) => {
								return validateAndGenErrMsgs(entryForm).then(res => {
									if (res.isSuccess) {
										return onSubmit(...params)
									} else {
										message.error(res.errMsgs)
										return Promise.reject(`表单校验失败: ${res.errMsgs}`)
									}
								})
							}}
							isRequesting={isRequesting}
							className="w-full !text-theme-text"
							uploadFileApi={(...params) => {
								return difyApi.uploadFile(...params)
							}}
							audio2TextApi={(...params) => difyApi.audio2Text(...params)}
							onCancel={onCancel}
						/>
					</div>
					<div className="text-theme-desc text-sm text-center h-8 leading-8 truncate">
						{currentApp?.site?.custom_disclaimer || '内容由 AI 生成, 仅供参考'}
					</div>
				</div>
			</div>
		</div>
	)
}
