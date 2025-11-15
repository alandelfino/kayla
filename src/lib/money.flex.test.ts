import { defineCompanyMoneyConfig, formatMoneyWithConfig, parseMoneyStringToCents, convertMoneyString, validateMoneyString, formatCentsWithConfig } from './format'

export function runMoneyFlexTests() {
  const usd = defineCompanyMoneyConfig('usd', {
    symbol: '$',
    symbolPosition: 'prefix',
    thousandSeparator: ',',
    decimalSeparator: '.',
    decimalPlaces: 2,
    rounding: 'half_up',
    spaceBetweenSymbol: false,
  })
  const brl = defineCompanyMoneyConfig('brl', {
    symbol: 'R$',
    symbolPosition: 'prefix',
    thousandSeparator: '.',
    decimalSeparator: ',',
    decimalPlaces: 2,
    rounding: 'half_up',
    spaceBetweenSymbol: true,
  })
  const eur = defineCompanyMoneyConfig('eur', {
    symbol: '€',
    symbolPosition: 'suffix',
    thousandSeparator: '.',
    decimalSeparator: ',',
    decimalPlaces: 2,
    rounding: 'half_up',
    spaceBetweenSymbol: true,
  })

  const f1 = formatMoneyWithConfig(1234.56, usd)
  if (f1 !== '$1,234.56') throw new Error('usd format')
  const f2 = formatMoneyWithConfig(-9876.5, brl)
  if (f2 !== '-R$ 9.876,50') throw new Error('brl negative')
  const f3 = formatMoneyWithConfig(3000, eur)
  if (f3 !== '3.000,00 €') throw new Error('eur suffix')

  const p1 = parseMoneyStringToCents('R$ 1.234,56', brl)
  if (p1 !== 123456) throw new Error('parse brl')
  const p2 = parseMoneyStringToCents('$1,234.56', usd)
  if (p2 !== 123456) throw new Error('parse usd')

  const c1 = convertMoneyString('R$ 1.234,56', brl, usd)
  if (c1 !== '$1,234.56') throw new Error('convert brl→usd')

  const v1 = validateMoneyString('R$ 1.234,56', brl)
  if (!v1) throw new Error('validate brl')
  const v2 = validateMoneyString('$1,234.56', usd)
  if (!v2) throw new Error('validate usd')
  const v3 = validateMoneyString('abc', usd)
  if (v3) throw new Error('validate invalid')

  const f4 = formatCentsWithConfig(123456, usd)
  if (f4 !== '$1,234.56') throw new Error('format cents usd')

  for (let i = 0; i < 1000; i++) {
    const s = formatMoneyWithConfig(i * 1.23, usd)
    if (!s) throw new Error('perf')
  }

  return true
}