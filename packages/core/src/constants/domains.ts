/**
 * 域名常量枚举
 */
export const DOMAINS = {
	/**
	 * 宝武人资演示域名
	 */
	BWHR_DEMO: 'https://bwhrdemo.baowugroup.cn',
	/**
	 * Dify 官方域名
	 */
	DIFY_OFFICIAL: 'https://api.dify.ai',
} as const

/**
 * API 路径常量
 */
export const API_PATHS = {
	/**
	 * 控制台 API 路径
	 */
	CONSOLE: '/special/ai/console/api',
	/**
	 * Dify API v1 路径
	 */
	V1: '/special/ai/v1',
	/**
	 * 官方 Dify API v1 路径
	 */
	OFFICIAL_V1: '/v1',
} as const 