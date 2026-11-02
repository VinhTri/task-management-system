import {
  Baby, BadgeDollarSign, Banknote, BriefcaseBusiness, Bus, Car, CircleEllipsis, Coffee,
  Droplets, Dumbbell, Fuel, Gamepad2, Gift, GraduationCap, HandCoins, HeartPulse, House,
  Landmark, PawPrint, PiggyBank, Plane, ReceiptText, Shirt, ShoppingBag, Smartphone,
  TrendingUp, Utensils, WalletCards, Wifi, Zap, type LucideIcon,
} from 'lucide-react'
import type { CategoryType } from './types/api'

export const ICON_COLORS: Record<string, string> = {
  food: '#EF4444', coffee: '#92400E', shopping: '#EC4899', home: '#8B5CF6', car: '#2563EB',
  bus: '#0891B2', fuel: '#F97316', health: '#E11D48', education: '#4F46E5', entertainment: '#9333EA',
  travel: '#0EA5E9', phone: '#475569', internet: '#06B6D4', electricity: '#EAB308', water: '#0284C7',
  clothing: '#D946EF', gift: '#F43F5E', pet: '#A16207', childcare: '#FB7185', fitness: '#DC2626',
  bill: '#64748B', cash: '#16A34A', wallet: '#7C3AED', salary: '#059669', investment: '#10B981',
  bank: '#1D4ED8', saving: '#14B8A6', bonus: '#F59E0B', business: '#65A30D', other: '#6B7280',
}

export const INCOME_ICON_COLORS: Record<string, string> = {
  food: '#15803D', coffee: '#0F766E', shopping: '#0369A1', home: '#1E40AF', car: '#4338CA',
  bus: '#6D28D9', fuel: '#A21CAF', health: '#BE123C', education: '#C2410C', entertainment: '#B45309',
  travel: '#4D7C0F', phone: '#047857', internet: '#0E7490', electricity: '#A3A000', water: '#075985',
  clothing: '#86198F', gift: '#9F1239', pet: '#713F12', childcare: '#C0266D', fitness: '#991B1B',
  bill: '#334155', cash: '#22C55E', wallet: '#6366F1', salary: '#0D9488', investment: '#34D399',
  bank: '#3B82F6', saving: '#2DD4BF', bonus: '#FBBF24', business: '#84CC16', other: '#9CA3AF',
}

export function getCategoryColor(icon: string, type: CategoryType, fallback = '#6B7280') {
  return (type === 'INCOME' ? INCOME_ICON_COLORS : ICON_COLORS)[icon] ?? fallback
}

export const CATEGORY_ICONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'food', label: 'Ăn uống', Icon: Utensils }, { key: 'coffee', label: 'Cà phê', Icon: Coffee },
  { key: 'shopping', label: 'Mua sắm', Icon: ShoppingBag }, { key: 'home', label: 'Nhà cửa', Icon: House },
  { key: 'car', label: 'Ô tô', Icon: Car }, { key: 'bus', label: 'Xe buýt', Icon: Bus },
  { key: 'fuel', label: 'Nhiên liệu', Icon: Fuel }, { key: 'health', label: 'Sức khỏe', Icon: HeartPulse },
  { key: 'education', label: 'Giáo dục', Icon: GraduationCap }, { key: 'entertainment', label: 'Giải trí', Icon: Gamepad2 },
  { key: 'travel', label: 'Du lịch', Icon: Plane }, { key: 'phone', label: 'Điện thoại', Icon: Smartphone },
  { key: 'internet', label: 'Internet', Icon: Wifi }, { key: 'electricity', label: 'Điện', Icon: Zap },
  { key: 'water', label: 'Nước', Icon: Droplets }, { key: 'clothing', label: 'Quần áo', Icon: Shirt },
  { key: 'gift', label: 'Quà tặng', Icon: Gift }, { key: 'pet', label: 'Thú cưng', Icon: PawPrint },
  { key: 'childcare', label: 'Con cái', Icon: Baby }, { key: 'fitness', label: 'Thể thao', Icon: Dumbbell },
  { key: 'bill', label: 'Hóa đơn', Icon: ReceiptText }, { key: 'cash', label: 'Tiền mặt', Icon: Banknote },
  { key: 'wallet', label: 'Ví tiền', Icon: WalletCards }, { key: 'salary', label: 'Lương', Icon: BriefcaseBusiness },
  { key: 'investment', label: 'Đầu tư', Icon: TrendingUp }, { key: 'bank', label: 'Ngân hàng', Icon: Landmark },
  { key: 'saving', label: 'Tiết kiệm', Icon: PiggyBank }, { key: 'bonus', label: 'Thưởng', Icon: BadgeDollarSign },
  { key: 'business', label: 'Kinh doanh', Icon: HandCoins }, { key: 'other', label: 'Khác', Icon: CircleEllipsis },
]

export const CATEGORY_ICON_MAP = new Map(CATEGORY_ICONS.map((item) => [item.key, item.Icon]))
