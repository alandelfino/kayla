import { defineCompanyDateConfig, formatDateWithConfig, validateDateString, convertDateString, parseDateString } from './format'

export function runDateFlexTests() {
  const br = defineCompanyDateConfig('br', { pattern: 'dd/MM/yyyy HH:mm:ss' })
  const us = defineCompanyDateConfig('us', { pattern: 'yyyy/MM/dd HH:mm:ss' })

  const d = new Date(Date.UTC(2024, 0, 2, 3, 4, 5))
  const s1 = formatDateWithConfig(d, br)
  if (!/^02\/01\/2024\s03:04:05$/.test(s1)) throw new Error('format br')
  const s2 = formatDateWithConfig(d, us)
  if (!/^2024\/01\/02\s03:04:05$/.test(s2)) throw new Error('format us')

  const v1 = validateDateString('02/01/2024 03:04:05', br)
  if (!v1) throw new Error('validate br')
  const v2 = validateDateString('2024/01/02 03:04:05', us)
  if (!v2) throw new Error('validate us')
  const v3 = validateDateString('invalid', us)
  if (v3) throw new Error('validate invalid')

  const p = parseDateString('02/01/2024 03:04:05', br)
  if (!p) throw new Error('parse br')
  const s3 = convertDateString('02/01/2024 03:04:05', br, us)
  if (!/^2024\/01\/02\s03:04:05$/.test(s3)) throw new Error('convert br→us')

  return true
}