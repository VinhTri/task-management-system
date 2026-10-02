export interface PasswordRule {
  key: string
  label: string
  valid: boolean
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { key: 'length', label: 'Từ 12 đến 72 ký tự', valid: password.length >= 12 && password.length <= 72 },
    { key: 'lowercase', label: 'Có ít nhất một chữ thường (a-z)', valid: /[a-z]/.test(password) },
    { key: 'uppercase', label: 'Có ít nhất một chữ hoa (A-Z)', valid: /[A-Z]/.test(password) },
    { key: 'special', label: 'Có ít nhất một ký tự đặc biệt', valid: /[^A-Za-z0-9\s]/.test(password) },
    { key: 'spaces', label: 'Không chứa khoảng trắng', valid: !/\s/.test(password) },
  ]
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRules(password).every((rule) => rule.valid)
}
