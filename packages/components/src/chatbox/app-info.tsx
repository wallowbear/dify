import {
	AppContext,
	ICurrentApp,
	useAppContext,
	useDifyChat,
} from "@dify-chat/core";
import { Tag } from "antd";
import { useContext, useMemo } from "react";

import AppIcon from "./app-icon";

/**
 * 应用信息
 */
export function AppInfo() {
	const context = useAppContext();
	const appContext = useContext(AppContext);
	const difyX = useDifyChat();

	console.log("difyX", difyX);

	console.log("appContext", appContext);

	console.log("context", context);

	const currentApp = context.currentApp;

	console.log("currentApp", currentApp);

	const info4Render = useMemo(() => {
		if (!currentApp?.config && !currentApp?.site) {
			return {
				name: "暂无标题",
				description: "",
				tags: [],
			};
		}
		const { site, config } = currentApp as ICurrentApp;
		console.log("site, config", site, config);
		return {
			name: site?.title || config?.info?.name,
			description: site?.description || config?.info?.description,
			tags: config?.info?.tags || [],
		};
	}, [currentApp?.config, currentApp?.site]);

	return (
		<div className="text-theme-text pt-3">
			<div className="flex items-center px-4 mt-3">
				<AppIcon />
				<div className="px-3 box-border flex-1 overflow-hidden">
					<div className="text-theme-text text-sm truncate">
						{info4Render.name}
					</div>
					{info4Render.description ? (
						<div
							className="text-sm text-desc truncate"
							title={info4Render.description}
						>
							{info4Render.description}
						</div>
					) : null}
				</div>
			</div>
			{info4Render.tags ? (
				<div className="mt-3 px-4">
					{info4Render.tags.map((tag) => {
						return (
							<Tag key={tag} className="!mb-2">
								{tag}
							</Tag>
						);
					})}
				</div>
			) : null}
		</div>
	);
}
