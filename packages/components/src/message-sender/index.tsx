import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons'
import { Attachments, AttachmentsProps, Sender } from '@ant-design/x'
import { DifyApi, IFile, IUploadFileResponse } from '@dify-chat/api'
import { useAppContext } from '@dify-chat/core'
import { useThemeContext } from '@dify-chat/theme'
import { Badge, Button, GetProp, GetRef, message } from 'antd'
import { RcFile } from 'antd/es/upload'
import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { FileTypeMap, getFileExtByName, getFileTypeByName } from './utils'

interface IMessageSenderProps {
	/**
	 * 类名
	 */
	className?: string
	/**
	 * 是否正在请求
	 */
	isRequesting: boolean
	/**
	 * 上传文件 Api
	 */
	uploadFileApi: (file: File) => Promise<IUploadFileResponse>
	/**
	 * 语音转文字 Api
	 */
	audio2TextApi?: DifyApi['audio2Text']
	/**
	 * 提交事件
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
	 * 取消事件
	 */
	onCancel: () => void
}
function getSupportedMimeType() {
	const types = [
	  'audio/webm;codecs=opus',
	  'audio/webm',
	  'audio/mp4',
	  'audio/mpeg',
	  'audio/aac',
	  'audio/wav',
	];
	for (const type of types) {
	  if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return 'audio/webm';
  }
/**
 * 用户消息发送区
 */
export const MessageSender = (props: IMessageSenderProps) => {
	const { isRequesting, onSubmit, className, onCancel, uploadFileApi, audio2TextApi } = props
	const { currentApp } = useAppContext()
	const [content, setContent] = useState('')
	const [open, setOpen] = useState(false)
	const [files, setFiles] = useState<GetProp<AttachmentsProps, 'items'>>([])
	const [fileIdMap, setFileIdMap] = useState<Map<string, string>>(new Map())
	const recordedChunks = useRef<Blob[]>([])
	const [audio2TextLoading, setAudio2TextLoading] = useState(false)
	const attachmentsRef = useRef<GetRef<typeof Attachments>>(null)
	const senderRef = useRef<GetRef<typeof Sender>>(null)
	const { isLight } = useThemeContext()

	const onChange = (value: string) => {
		setContent(value)
	}

	const allowedFileTypes = useMemo(() => {
		if (!currentApp?.parameters?.file_upload) {
			return []
		}
		const result: string[] = []
		currentApp.parameters.file_upload.allowed_file_types.forEach(item => {
			if (FileTypeMap.get(item)) {
				result.push(...((FileTypeMap.get(item) as string[]) || []))
			}
		})
		return result
	}, [currentApp?.parameters?.file_upload])

	const handleUpload = async (file: RcFile) => {
		const prevFiles = [...files]

		const fileBaseInfo: GetProp<AttachmentsProps, 'items'>[number] = {
			uid: file.uid,
			name: file.name,
			status: 'uploading',
			size: file.size,
			type: file.type,
			originFileObj: file,
		}

		// 模拟上传进度
		const mockLoadingProgress = () => {
			let percent = 0
			setFiles([
				...prevFiles,
				{
					...fileBaseInfo,
					percent: percent,
				},
			])
			const interval = setInterval(() => {
				if (percent >= 99) {
					clearInterval(interval)
					return
				}
				percent = percent + 1
				setFiles([
					...prevFiles,
					{
						...fileBaseInfo,
						percent,
					},
				])
			}, 100)
			return {
				clear: () => clearInterval(interval),
			}
		}
		const { clear } = mockLoadingProgress()

		const result = await uploadFileApi(file)
		clear()
		setFiles([
			...prevFiles,
			{
				...fileBaseInfo,
				percent: 100,
				status: 'done',
			},
		])
		setFileIdMap(prevMap => {
			const nextMap = new Map(prevMap)
			nextMap.set(file.uid, result.id)
			return nextMap
		})
	}

	const senderHeader = (
		<Sender.Header
			title="上传文件"
			open={open}
			onOpenChange={setOpen}
			styles={{
				content: {
					padding: 0,
				},
			}}
		>
			<Attachments
				ref={attachmentsRef}
				beforeUpload={async file => {
					// 校验文件类型
					// 自定义上传
					const ext = getFileExtByName(file.name)
					// 校验文件类型
					if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(ext!)) {
						message.error(`不支持的文件类型: ${ext}`)
						return false
					}

					handleUpload(file)
					return false
				}}
				items={files}
				placeholder={type =>
					type === 'drop'
						? {
								title: 'Drop file here',
							}
						: {
								icon: <CloudUploadOutlined />,
								title: '点击或拖拽文件到此区域上传',
								description: (
									<div>
										支持的文件类型：
										{allowedFileTypes.join(', ')}
									</div>
								),
							}
				}
				getDropContainer={() => senderRef.current?.nativeElement}
				onRemove={file => {
					setFiles(prev => {
						return prev.filter(item => {
							return item.uid !== file.uid
						})
					})
				}}
			/>
		</Sender.Header>
	)

	const [recording, setRecording] = useState(false)
	const mediaRecorder = useRef<MediaRecorder | null>(null)

	/**
	 * 语音转文本配置
	 */
	const allowSpeechConfig = useMemo(() => {
		return {
		  recording,
		  onRecordingChange: async (nextRecording) => {
			if (nextRecording) {
			  try {
				// 获取麦克风权限
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	  
				// 动态选择兼容的 MIME 类型
				const mimeType = getSupportedMimeType();
	  
				// 创建 AudioContext 用于重采样
				const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
				  sampleRate: 16000, // 固定采样率
				});
	  
				const source = audioContext.createMediaStreamSource(stream);
				const destination = audioContext.createMediaStreamDestination();
	  
				// 设置为单声道
				const channelSplitter = audioContext.createChannelSplitter(2);
				const channelMerger = audioContext.createChannelMerger(2);
	  
				source.connect(channelSplitter);
				channelSplitter.connect(channelMerger, 0, 0); // 只保留左声道
				channelSplitter.connect(channelMerger, 0, 1); // 复制左声道到右声道（可选）
				channelMerger.connect(destination);
	  
				// 创建 MediaRecorder，使用兼容的音频格式
				mediaRecorder.current = new MediaRecorder(destination.stream, { mimeType });
	  
				recordedChunks.current = [];
	  
				mediaRecorder.current.ondataavailable = (event) => {
				  if (event.data.size > 0) {
					recordedChunks.current.push(event.data);
				  }
				};
	  
				mediaRecorder.current.onstop = () => {
				  const blob = new Blob(recordedChunks.current, { type: mimeType });
				  setAudio2TextLoading(true);
				  setContent('正在识别...');
	  
				  // 转成 File 对象上传
				  const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType });
	  
				  audio2TextApi?.(file)
					.then((res) => {
					  setContent(res.text);
					  recordedChunks.current = [];
					})
					.catch((error) => {
					  console.error('语音转文本错误', error);
					  message.error(`语音转文本错误: ${error}`);
					  setContent('');
					})
					.finally(() => {
					  setAudio2TextLoading(false);
					});
	  
				  // 关闭 AudioContext（iOS 上不关闭可能导致崩溃）
				  audioContext.close();
				};
	  
				mediaRecorder.current.start();
			  } catch (error) {
				console.error('Error accessing microphone:', error);
				message.error('无法访问麦克风，请检查权限');
			  }
			} else {
			  mediaRecorder.current?.stop();
			}
	  
			setRecording(nextRecording);
		  },
		} as GetProp<typeof Sender, 'allowSpeech'>;
	  }, [currentApp, recording, audio2TextApi]);

	// 是否允许文件上传
	// const enableFileUpload = currentApp?.parameters?.file_upload?.enabled
	const enableFileUpload = true

	return (
		<Sender
			allowSpeech={allowSpeechConfig}
			header={senderHeader}
			value={content}
			onChange={onChange}
			prefix={
				enableFileUpload ? (
					// 附件上传按钮
					<Badge dot={files.length > 0 && !open}>
						<Button
							onClick={() => setOpen(!open)}
							icon={<LinkOutlined className="text-theme-text" />}
						/>
					</Badge>
				) : null
			}
			style={{
				boxShadow: isLight ? '0px -2px 12px 4px var(--theme-border-color)' : 'none',
			}}
			loading={isRequesting}
			disabled={audio2TextLoading}
			className={className}
			onPasteFile={
				enableFileUpload
					? (firstFile, files) => {
							if (files?.length > 1) {
								message.warning('暂不支持一次性上传多个文件，请逐个上传')
								return
							}
							// 如果附件面板是关闭状态，则打开
							if (!open) {
								// 强制更新 立即打开 Attachments 面板，以供获取 attachmentsRef
								flushSync(() => setOpen(true))
							}
							attachmentsRef.current?.upload(firstFile)
						}
					: undefined
			}
			onSubmit={async content => {
				if (!content) {
					message.error('内容不能为空')
					return
				}
				// 当文件存在时，判断是否所有文件都已上传完成
				if (files?.length && !files.every(item => item.status === 'done')) {
					message.error('请等待所有文件上传完成')
					return
				}
				await onSubmit(content, {
					files:
						files?.map(file => {
							const fileType = getFileTypeByName(file.name)
							return {
								...file,
								type: fileType || 'document',
								transfer_method: 'local_file',
								upload_file_id: fileIdMap.get(file.uid) as string,
							}
						}) || [],
				})
				setContent('')
				setFiles([])
				setOpen(false)
			}}
			onCancel={onCancel}
		/>
	)
}
