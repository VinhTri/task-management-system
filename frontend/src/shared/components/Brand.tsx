import { WalletCards } from 'lucide-react'

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <span className="brand__mark"><WalletCards size={21} strokeWidth={2.4} /></span>
      <span>Smart<span>Spend</span></span>
    </div>
  )
}
