// ============================================================
// Proposal / Penawaran HTML template builder
// ------------------------------------------------------------
// Pure function that turns structured proposal data into a self-contained
// HTML document matching the Sudut Ruang proposal design. Used by the
// dashboard (preview + print-to-PDF + download). The same structure can be
// ported to n8n for server-side generation.
// ============================================================

export type Currency = 'IDR' | 'USD'

export interface ProposalLineItem {
  description: string
  volume: string // free text e.g. "1 Paket" or "260 m²"
  qty: number
  unitPrice: number
}

export interface ProposalTimelineItem {
  badge: string // e.g. "W1-W2"
  text: string
}

export interface ProposalPaletteItem {
  name: string
  usage: string
  color: string // hex
}

export interface ProposalSummaryCard {
  title: string
  body: string
}

export interface ProposalData {
  proposalNo: string
  dateLabel: string
  confidentialNote: string
  projectTitle: string
  projectTitleAccent: string
  subtitle: string
  preparedFor: string // may contain newlines
  metaSmall: string
  currency: Currency
  taxRate: number // e.g. 0.11
  summaryTitle: string
  summaryCards: ProposalSummaryCard[]
  paletteTitle: string
  paletteIntro: string
  palette: ProposalPaletteItem[]
  timelineTitle: string
  timeline: ProposalTimelineItem[]
  pricingTitle: string
  lineItems: ProposalLineItem[]
  notes: string
  company: { name: string; locations: string; phone: string; logo: string }
}

/** Escape user text for safe HTML interpolation. */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escape and convert newlines to <br>. */
function escMultiline(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

export function formatMoney(currency: Currency, n: number): string {
  const value = Number.isFinite(n) ? n : 0
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)
}

export function lineTotal(item: ProposalLineItem): number {
  const qty = Number.isFinite(item.qty) ? item.qty : 0
  const price = Number.isFinite(item.unitPrice) ? item.unitPrice : 0
  return qty * price
}

export function computeTotals(data: ProposalData) {
  const subtotal = data.lineItems.reduce((sum, it) => sum + lineTotal(it), 0)
  const tax = subtotal * (data.taxRate || 0)
  const grandTotal = subtotal + tax
  return { subtotal, tax, grandTotal }
}

const PALETTE_PRIMARY = '#2b7571'
const PALETTE_SECONDARY = '#ca7f45'

export function buildProposalHTML(data: ProposalData): string {
  const cur = data.currency
  const curLabel = cur === 'USD' ? 'USD' : 'IDR'
  const { subtotal, tax, grandTotal } = computeTotals(data)

  const logoBlock = data.company.logo
    ? `<img src="${esc(data.company.logo)}" alt="Logo" style="height:48px;width:auto;object-fit:contain;margin-bottom:24px;border-radius:6px" />`
    : ''

  const summarySection =
    data.summaryCards.length > 0
      ? `
    <section>
      <div class="section-tag">Ringkasan</div>
      <h2>${esc(data.summaryTitle || 'Executive Summary')}</h2>
      <div class="summary-grid">
        ${data.summaryCards
          .map(
            (c) => `
        <div class="card">
          <h3>${esc(c.title)}</h3>
          <p>${escMultiline(c.body)}</p>
        </div>`,
          )
          .join('')}
      </div>
    </section>`
      : ''

  const paletteSection =
    data.palette.length > 0
      ? `
    <section>
      <div class="section-tag">Material & Warna</div>
      <h2>${esc(data.paletteTitle || 'Material & Color Direction')}</h2>
      ${data.paletteIntro ? `<p>${escMultiline(data.paletteIntro)}</p>` : ''}
      <div class="palette-container">
        ${data.palette
          .map(
            (p) => `
        <div class="color-swatch">
          <div class="color-preview" style="background:${esc(p.color)};"></div>
          <p><strong>${esc(p.name)}</strong><br><small>${esc(p.usage)}</small></p>
        </div>`,
          )
          .join('')}
      </div>
    </section>`
      : ''

  const timelineSection =
    data.timeline.length > 0
      ? `
    <section>
      <div class="section-tag">Timeline</div>
      <h2>${esc(data.timelineTitle || 'Timeline Kerja')}</h2>
      <ul class="timeline">
        ${data.timeline
          .map(
            (t) => `
        <li class="timeline-item"><span class="badge">${esc(t.badge)}</span> ${esc(t.text)}</li>`,
          )
          .join('')}
      </ul>
    </section>`
      : ''

  const rows = data.lineItems
    .map(
      (it) => `
        <tr class="rab-row">
          <td>${esc(it.description)}</td>
          <td>${esc(it.volume)}</td>
          <td class="text-right">${formatMoney(cur, it.unitPrice)}</td>
          <td class="text-right">${formatMoney(cur, lineTotal(it))}</td>
        </tr>`,
    )
    .join('')

  const pricingSection =
    data.lineItems.length > 0
      ? `
    <section>
      <div class="section-tag">Investasi</div>
      <h2>${esc(data.pricingTitle || 'Rincian Anggaran')}</h2>
      <table class="rab-table">
        <thead>
          <tr>
            <th>Deskripsi Layanan / Item Pekerjaan</th>
            <th>Volume</th>
            <th class="text-right">Harga Satuan (${curLabel})</th>
            <th class="text-right">Total (${curLabel})</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="calculation-box">
        <div class="calc-row">
          <span>Subtotal:</span>
          <span>${curLabel} ${formatMoney(cur, subtotal)}</span>
        </div>
        <div class="calc-row">
          <span>PPN (${Math.round((data.taxRate || 0) * 100)}%):</span>
          <span>${curLabel} ${formatMoney(cur, tax)}</span>
        </div>
        <div class="calc-row total">
          <span>Total Investasi:</span>
          <span>${curLabel} ${formatMoney(cur, grandTotal)}</span>
        </div>
      </div>
      ${data.notes ? `<p style="margin-top:24px;font-size:13px;color:var(--text-muted);">${escMultiline(data.notes)}</p>` : ''}
    </section>`
      : ''

  const titleHtml = data.projectTitleAccent
    ? `${esc(data.projectTitle)} <strong>${esc(data.projectTitleAccent)}</strong>`
    : esc(data.projectTitle)

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposal Penawaran - ${esc(data.projectTitle)}</title>
<style>
  :root {
    --primary-color: ${PALETTE_PRIMARY};
    --secondary-color: ${PALETTE_SECONDARY};
    --bg-light: #f2efe4;
    --text-dark: #222222;
    --text-muted: #666666;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: var(--text-dark);
    background-color: #f7f7f7;
    margin: 0;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
  }
  .proposal-paper {
    background: #ffffff;
    width: 100%;
    max-width: 900px;
    padding: 60px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border-radius: 4px;
  }
  header .confidential {
    font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 30px;
  }
  .main-title { font-size: 42px; font-weight: 300; line-height: 1.2; margin: 0 0 10px 0; color: var(--text-dark); }
  .main-title strong { color: var(--primary-color); font-weight: 700; }
  .subtitle { font-size: 18px; color: var(--secondary-color); margin-bottom: 40px; font-style: italic; }
  .meta-info { background-color: var(--bg-light); padding: 20px; border-left: 4px solid var(--primary-color); margin-bottom: 50px; font-size: 14px; }
  section { margin-bottom: 60px; }
  .section-tag { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--secondary-color); font-weight: bold; margin-bottom: 5px; }
  h2 { font-size: 24px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-top: 0; margin-bottom: 25px; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .card { border: 1px solid #e0e0e0; padding: 25px; border-radius: 6px; background: #fafafa; }
  .card h3 { margin-top: 0; color: var(--primary-color); }
  .palette-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 20px; }
  .color-swatch { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; background: #fff; text-align: center; padding-bottom: 12px; font-size: 13px; }
  .color-preview { height: 80px; width: 100%; }
  .timeline { list-style: none; padding: 0; position: relative; }
  .timeline-item { margin-bottom: 15px; padding-left: 30px; position: relative; }
  .timeline-item::before { content: ''; position: absolute; left: 0; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: var(--primary-color); }
  .timeline-item .badge { background: var(--bg-light); color: var(--text-dark); padding: 2px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; margin-right: 10px; }
  .rab-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
  .rab-table th { background-color: var(--primary-color); color: white; text-align: left; padding: 12px; font-weight: 500; }
  .rab-table td { padding: 12px; border-bottom: 1px solid #eeeeee; }
  .text-right { text-align: right; }
  .calculation-box { background: var(--bg-light); border-radius: 6px; padding: 25px; margin-top: 30px; margin-left: auto; width: 100%; max-width: 400px; }
  .calc-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
  .calc-row.total { border-top: 1px solid #dcd9cd; padding-top: 15px; font-size: 18px; font-weight: bold; color: var(--primary-color); }
  footer { margin-top: 80px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  @media print {
    body { background: #fff; padding: 0; }
    .proposal-paper { box-shadow: none; padding: 32px; max-width: none; }
  }
</style>
</head>
<body>
  <div class="proposal-paper" data-proposal-no="${esc(data.proposalNo)}">
    <header>
      ${logoBlock}
      <div class="confidential">${esc(data.confidentialNote)}</div>
      <h1 class="main-title">${titleHtml}</h1>
      ${data.subtitle ? `<div class="subtitle">${esc(data.subtitle)}</div>` : ''}
      <div class="meta-info">
        <strong>Disusun khusus untuk:</strong><br>
        ${escMultiline(data.preparedFor)}
        ${data.metaSmall ? `<br><small>${escMultiline(data.metaSmall)}</small>` : ''}
        <br><small>No. Proposal: ${esc(data.proposalNo)}</small>
      </div>
    </header>
    ${summarySection}
    ${paletteSection}
    ${timelineSection}
    ${pricingSection}
    <footer>
      <div><strong>${esc(data.company.name)}</strong>${data.company.locations ? ` • ${esc(data.company.locations)}` : ''}</div>
      ${data.company.phone ? `<div>Hubungi: ${esc(data.company.phone)}</div>` : ''}
    </footer>
  </div>
</body>
</html>`
}

/** Build sensible default proposal data from estimator output. */
export function defaultTimeline(): ProposalTimelineItem[] {
  return [
    { badge: 'W1-W2', text: 'Kick-Off & Design Review Report' },
    { badge: 'W3-W4', text: 'Concept Design (Layout Alternatif & Fasad)' },
    { badge: 'W5-W6', text: 'Schematic Design (3D & Pengembangan Material)' },
    { badge: 'W7-W9', text: 'Design Development (Detail & Koordinasi SE/MEP)' },
    { badge: 'W9-W11', text: 'Final Documentation (IFC Drawings, BOQ & PBG Support)' },
  ]
}
