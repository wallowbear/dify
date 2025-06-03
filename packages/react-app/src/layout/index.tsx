import { useDifyChat } from '@dify-chat/core'
import { Route, useHistory } from 'pure-react-router'
import { useEffect } from 'react'

/**
 * 处理路由的布局容器
 */
export default function LayoutIndex() {
	const history = useHistory()
	const { mode } = useDifyChat()

	useEffect(() => {
		const pathname = history.location.pathname
		if (pathname === '' || pathname === '/') {
			if (mode === 'singleApp') {
				history.push('/chat')
			} else if (mode === 'multiApp') {
				history.push('/apps')
			}
		}
	}, [history, mode])

	return <Route />
}
