/**
 * Indian-numbering amount-in-words, for printed receipts.
 * Groups as crore / lakh / thousand / hundred — not the western
 * million/billion — because that is what an Indian receipt must read.
 *
 * Paise are dropped: school fees are whole rupees and the printed
 * receipt says "only".
 */
export function rupeesInWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const two = (x: number): string =>
    x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`

  const three = (x: number): string =>
    x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ' ' + two(x % 100) : ''}` : two(x)

  let rest = Math.floor(n)
  if (rest === 0) return 'Zero'

  const parts: string[] = []
  for (const [div, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']] as const) {
    if (rest >= div) {
      parts.push(`${three(Math.floor(rest / div))} ${name}`)
      rest %= div
    }
  }
  if (rest) parts.push(three(rest))

  return parts.join(' ')
}
