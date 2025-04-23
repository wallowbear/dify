import {
	IGetAppParametersResponse,
	IUserInputFormItemType,
	IUserInputFormItemValueBase,
} from '@dify-chat/api'
import { IDifyAppItem, useDifyChat } from '@dify-chat/core'
import { useConversationsContext } from '@dify-chat/core'
import { isTempId, unParseGzipString } from '@dify-chat/helpers'
import { Form, FormInstance, FormItemProps, Input, InputNumber, message, Select } from 'antd'
import { useHistory, useParams, useSearchParams } from 'pure-react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export type IConversationEntryFormItem = FormItemProps &
	Pick<IUserInputFormItemValueBase, 'options' | 'max_length'> & {
		type: IUserInputFormItemType
	}

const SUPPORTED_CONTROL_TYPES = ['text-input', 'select', 'number', 'paragraph']

export interface IAppInputFormProps {
	/**
	 * 表单是否填写
	 */
	formFilled: boolean
	/**
	 * 表单填写状态改变回调
	 */
	onStartConversation: (formValues: Record<string, unknown>) => void
	/**
	 * 表单数据
	 */
	user_input_form?: IGetAppParametersResponse['user_input_form']
	/**
	 * 当前对话 ID
	 */
	conversationId: string
	/**
	 * 应用入参的表单实例
	 */
	// FIXME: any 类型后续优化 @ts-expect-error
	entryForm: FormInstance<Record<string, unknown>>
	/**
	 * 是否禁用输入
	 */
	appConfig?: IDifyAppItem
}

/**
 * 应用输入表单
 */
export default function AppInputForm(props: IAppInputFormProps) {
	const { user_input_form, conversationId, entryForm, appConfig } = props
	const { currentConversationId, currentConversationInfo, setConversations } =
		useConversationsContext()
	const history = useHistory()
	const { appId } = useParams<{ appId: string }>()
	const searchParams = useSearchParams()
	const [userInputItems, setUserInputItems] = useState<IConversationEntryFormItem[]>([])
	const cachedSearchParams = useRef<URLSearchParams>(new URLSearchParams(searchParams))
	const { mode } = useDifyChat()
	useEffect(() => {
		entryForm.resetFields()
	}, [conversationId])

	useEffect(() => {
		// 如果已经填写了，那就不需要了
		if (!user_input_form?.length) {
			setUserInputItems([])
			return
		}
		setUserInputItems(
			user_input_form?.map(item => {
				const fieldType = Object.keys(item)[0]
				const fieldInfo = Object.values(item)[0]
				const originalProps = fieldInfo
				const baseProps: IConversationEntryFormItem = {
					type: fieldType as IUserInputFormItemType,
					label: originalProps.label,
					name: originalProps.variable,
					options: originalProps.options,
					max_length: originalProps.max_length,
				}
				const searchValue = cachedSearchParams.current.get(originalProps.variable)
				if (searchValue) {
					const { error, data } = unParseGzipString(searchValue)

					if (error) {
						message.error(`解压缩参数 ${originalProps.variable} 失败: ${error}`)
					}

					// 解析正常且是新对话 或者允许更新对话参数，则写入 URL 参数
					if (
						(!error && isTempId(conversationId)) ||
						appConfig?.inputParams?.enableUpdateAfterCvstStarts
					) {
						// 新对话或者允许更新对话参数, 则更新表单值
						entryForm.setFieldValue(originalProps.variable, data)
						cachedSearchParams.current.delete(originalProps.variable)
					} else {
						entryForm.setFieldValue(
							originalProps.variable,
							currentConversationInfo?.inputs?.[originalProps.variable],
						)
					}
				} else {
					entryForm.setFieldValue(
						originalProps.variable,
						currentConversationInfo?.inputs?.[originalProps.variable],
					)
				}
				if (originalProps.required) {
					baseProps.required = true
					baseProps.rules = [{ required: true, message: '请输入' }]
				}
				return baseProps
			}) || [],
		)
		// 如果处理后的参数数量和之前的不一致，表示有表单相关，更新 URL
		if (searchParams.size !== cachedSearchParams.current.size) {
			if (cachedSearchParams.current.has('isNewCvst')) {
				cachedSearchParams.current.delete('isNewCvst')
			}
			const searchString = cachedSearchParams.current.size
				? `?${cachedSearchParams.current.toString()}`
				: ''
			if (mode === 'multiApp') {
				history.push(`/app/${appId}${searchString}`)
			} else {
				history.push(`/chat${searchString}`)
			}
		}
	}, [user_input_form, currentConversationInfo])

	console.log('user_input_form', user_input_form)

	/**
	 * 是否禁用输入
	 */
	const disabled = useMemo(() => {
		// 如果是临时对话，则允许输入
		if (isTempId(conversationId)) {
			return false
		}
		// 否则取配置值
		return !appConfig?.inputParams?.enableUpdateAfterCvstStarts
	}, [conversationId])

	return (
		<>
			{user_input_form?.length ? (
				<>
					<Form
						layout="vertical"
						form={entryForm}
						labelCol={{ span: 5 }}
						onValuesChange={(_, allValues) => {
							setConversations(prev => {
								console.log(
									'setConversations: onValuesChange',
									prev.map(item => {
										if (item.id === currentConversationId) {
											return {
												...item,
												inputs: allValues,
											}
										}
										return item
									}),
								)
								return prev.map(item => {
									if (item.id === currentConversationId) {
										return {
											...item,
											inputs: allValues,
										}
									}
									return item
								})
							})
						}}
					>
						{userInputItems
							.filter(item => SUPPORTED_CONTROL_TYPES.includes(item.type))
							.map(item => {
								return (
									<Form.Item
										key={item.name}
										name={item.name}
										label={item.label}
										required={item.required}
										rules={
											item.required
												? [
														{
															required: true,
															message: `${item.label}不能为空`,
														},
													]
												: []
										}
									>
										{item.type === 'text-input' ? (
											<Input
												placeholder="请输入"
												maxLength={item.max_length}
												disabled={disabled}
											/>
										) : item.type === 'select' ? (
											<Select
												placeholder="请选择"
												disabled={disabled}
												options={
													item.options?.map(option => {
														return {
															value: option,
															label: option,
														}
													}) || []
												}
											/>
										) : item.type === 'paragraph' ? (
											<Input.TextArea
												placeholder="请输入"
												disabled={disabled}
												maxLength={item.max_length}
											/>
										) : item.type === 'number' ? (
											<InputNumber
												placeholder="请输入"
												disabled={disabled}
												className="w-full"
											/>
										) : (
											`暂不支持的控件类型: ${item.type}`
										)}
									</Form.Item>
								)
							})}
					</Form>
				</>
			) : null}
		</>
	)
}
