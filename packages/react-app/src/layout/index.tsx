import { useDifyChat } from '@dify-chat/core'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AppListPage from '../pages/app-list'
import ChatPage from '../pages/chat'

/**
 * 处理路由的布局容器
 */
export default function LayoutIndex() {
	const navigate = useNavigate()
	const location = useLocation()
	const { mode } = useDifyChat()

	useEffect(() => {
		const pathname = location.pathname
		if (pathname === '' || pathname === '/') {
			if (mode === 'singleApp') {
				navigate('/chat')
			} else if (mode === 'multiApp') {
				navigate('/apps')
			}
		}
	}, [navigate, location, mode])

	return (
		<Routes>
			<Route path="/chat" element={<ChatPage />} />
			<Route path="/app/:appId" element={<ChatPage />} />
			<Route path="/apps" element={<AppListPage />} />
			<Route path="*" element={<AppListPage />} />
		</Routes>
	)
}
