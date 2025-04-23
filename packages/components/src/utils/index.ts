import { FormInstance } from 'antd'

/**
 * 校验表单, 如果校验未通过则生成错误信息
 */
export const validateAndGenErrMsgs = (
	form: FormInstance<Record<string, unknown>>,
): Promise<{ isSuccess: boolean; errMsgs: string }> => {
	return new Promise((resolve, _reject) => {
		form
			.validateFields()
			.then(() => {
				resolve({
					isSuccess: true,
					errMsgs: '',
				})
			})
			.catch(error => {
				console.error('表单校验失败', error)
				const errMsgs = (
					error as {
						errorFields: {
							errors: string[]
						}[]
					}
				).errorFields
					.map(item => {
						return item.errors?.join(',') || ''
					})
					.filter(Boolean)
					.join(',')
				resolve({
					isSuccess: false,
					errMsgs,
				})
			})
	})
}
