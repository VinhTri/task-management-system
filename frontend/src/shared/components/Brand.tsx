export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <span className="brand__wordmark" aria-label="SmartSpend">
        <span>Smart</span><span>Spend</span>
      </span>
    </div>
  )
}
