// Pricing Service - Data RAB & Fee Sudut Ruang
// Sumber kebenaran: Google Spreadsheet (tab "RAB Biaya Konstruksi" & "Fee Jasa Arsitek").
// Angka di bawah disinkronkan manual agar sama persis dengan sheet. Stub
// PricingSheetService di bawah bisa dipakai untuk fetch live via n8n nanti.

import { ConstructionRate, DesignServiceRate, RabEstimate, FeeEstimate } from '../types/pricing'

// ============================================================
// SHEET 2: RAB Biaya Konstruksi
// ============================================================
export const constructionRates: ConstructionRate[] = [
  {
    id: 'rmh-eko',
    type: 'Rumah Tinggal',
    tier: 'Ekonomi',
    pricePerSqmMin: 3_000_000,
    pricePerSqmMax: 4_500_000,
    specification: 'Bata merah, keramik standar, cat lokal',
    notes: 'Type 21-36',
  },
  {
    id: 'rmh-std',
    type: 'Rumah Tinggal',
    tier: 'Standar',
    pricePerSqmMin: 4_500_000,
    pricePerSqmMax: 6_000_000,
    specification: 'Bata ringan, granit, cat premium',
    notes: 'Type 36-70',
  },
  {
    id: 'rmh-mng',
    type: 'Rumah Tinggal',
    tier: 'Menengah Atas',
    pricePerSqmMin: 6_000_000,
    pricePerSqmMax: 8_000_000,
    specification: 'Material impor sebagian, plafon gypsum detail',
    notes: 'Type 70-150',
  },
  {
    id: 'rmh-prm',
    type: 'Rumah Tinggal',
    tier: 'Mewah/Premium',
    pricePerSqmMin: 8_000_000,
    pricePerSqmMax: 15_000_000,
    specification: 'Full material premium, smart home, kolam renang',
    notes: 'Custom design',
  },
  {
    id: 'ruko-std',
    type: 'Ruko / Kios',
    tier: 'Standar',
    pricePerSqmMin: 3_500_000,
    pricePerSqmMax: 5_000_000,
    specification: 'Struktur beton, fasad sederhana',
    notes: '2-3 lantai',
  },
  {
    id: 'ruko-prm',
    type: 'Ruko / Kios',
    tier: 'Premium',
    pricePerSqmMin: 5_000_000,
    pricePerSqmMax: 7_000_000,
    specification: 'ACP, kaca tempered, lift opsional',
    notes: '3-5 lantai',
  },
  {
    id: 'cafe-std',
    type: 'Cafe / Restoran',
    tier: 'Standar',
    pricePerSqmMin: 4_000_000,
    pricePerSqmMax: 6_000_000,
    specification: 'Partisi, plafon ekspos, lighting dasar',
    notes: 'Termasuk fit-out dasar',
  },
  {
    id: 'cafe-prm',
    type: 'Cafe / Restoran',
    tier: 'Premium',
    pricePerSqmMin: 7_000_000,
    pricePerSqmMax: 10_000_000,
    specification: 'Full custom interior, HVAC, audio system',
    notes: 'Flagship store',
  },
  {
    id: 'kntr-std',
    type: 'Kantor',
    tier: 'Standar',
    pricePerSqmMin: 3_500_000,
    pricePerSqmMax: 5_000_000,
    specification: 'Open plan, raised floor opsional',
    notes: 'Per m² luas lantai',
  },
  {
    id: 'kntr-prm',
    type: 'Kantor',
    tier: 'Premium',
    pricePerSqmMin: 5_000_000,
    pricePerSqmMax: 8_000_000,
    specification: 'Full partisi, false ceiling, M&E lengkap',
    notes: 'Grade A',
  },
  {
    id: 'vila-std',
    type: 'Villa / Guest House',
    tier: 'Standar',
    pricePerSqmMin: 5_000_000,
    pricePerSqmMax: 7_000_000,
    specification: 'Tropis, kayu lokal, kolam kecil',
    notes: '',
  },
  {
    id: 'vila-prm',
    type: 'Villa / Guest House',
    tier: 'Premium',
    pricePerSqmMin: 10_000_000,
    pricePerSqmMax: 12_000_000,
    specification: 'Infinity pool, stone wall, smart system',
    notes: '',
  },
  {
    id: 'reno-rng',
    type: 'Renovasi (Parsial)',
    tier: 'Ringan',
    pricePerSqmMin: 1_500_000,
    pricePerSqmMax: 3_000_000,
    specification: 'Cat ulang, keramik, partisi ringan',
    notes: 'Max 30% area',
  },
  {
    id: 'reno-sdg',
    type: 'Renovasi (Parsial)',
    tier: 'Sedang',
    pricePerSqmMin: 3_000_000,
    pricePerSqmMax: 5_000_000,
    specification: 'Bongkar pasang, MEP sebagian',
    notes: '30-60% area',
  },
  {
    id: 'reno-ttl',
    type: 'Renovasi (Total)',
    tier: 'Full Gut',
    pricePerSqmMin: 5_000_000,
    pricePerSqmMax: 8_000_000,
    specification: 'Bongkar total hingga struktur',
    notes: '60-100% area',
  },
]


// ============================================================
// SHEET 1: Tabel Fee Jasa Desain
// ============================================================
export const designServiceRates: DesignServiceRate[] = [
  {
    id: 'arsi-std',
    serviceName: 'Desain Arsitektur - Standar',
    category: 'Arsitektur',
    tier: 'Standar',
    description: 'Gambar 2D, site plan, denah, tampak, potongan',
    feePercentMin: 7,
    feePercentMax: 7,
    feePerSqmMin: 75_000,
    feePerSqmMax: 75_000,
    suitableFor: 'Cocok untuk rumah type 36-70',
  },
  {
    id: 'arsi-mng',
    serviceName: 'Desain Arsitektur - Menengah',
    category: 'Arsitektur',
    tier: 'Menengah',
    description: '2D + 3D rendering, animasi eksterior',
    feePercentMin: 5,
    feePercentMax: 5,
    feePerSqmMin: 100_000,
    feePerSqmMax: 100_000,
    suitableFor: 'Rumah type 70-150, villa',
  },
  {
    id: 'arsi-prm',
    serviceName: 'Desain Arsitektur - Premium',
    category: 'Arsitektur',
    tier: 'Premium',
    description: 'Full 3D, VR walkthrough, detail engineering',
    feePercentMin: 4,
    feePercentMax: 4,
    feePerSqmMin: 200_000,
    feePerSqmMax: 200_000,
    suitableFor: 'Rumah mewah, komersial besar',
  },
  {
    id: 'int-std',
    serviceName: 'Desain Interior - Standar',
    category: 'Interior',
    tier: 'Standar',
    description: 'Layout furnitur, skema warna, material board',
    feePercentMin: 7,
    feePercentMax: 7,
    feePerSqmMin: 75_000,
    feePerSqmMax: 75_000,
    suitableFor: '1-2 ruang',
  },
  {
    id: 'int-mng',
    serviceName: 'Desain Interior - Menengah',
    category: 'Interior',
    tier: 'Menengah',
    description: '3D render per ruang, RAB interior',
    feePercentMin: 5,
    feePercentMax: 5,
    feePerSqmMin: 100_000,
    feePerSqmMax: 100_000,
    suitableFor: 'Full unit',
  },
  {
    id: 'int-prm',
    serviceName: 'Desain Interior - Premium',
    category: 'Interior',
    tier: 'Premium',
    description: 'Custom furniture, styling, pengawasan',
    feePercentMin: 4,
    feePercentMax: 4,
    feePerSqmMin: 200_000,
    feePerSqmMax: 200_000,
    suitableFor: 'Luxury, hospitality',
  },
  {
    id: 'lns-std',
    serviceName: 'Desain Lansekap - Standar',
    category: 'Lansekap',
    tier: 'Standar',
    description: 'Layout taman, tanaman, material',
    feePercentMin: 7,
    feePercentMax: 7,
    feePerSqmMin: 75_000,
    feePerSqmMax: 75_000,
    suitableFor: 'Taman residensial',
  },
  {
    id: 'lns-prm',
    serviceName: 'Desain Lansekap - Premium',
    category: 'Lansekap',
    tier: 'Premium',
    description: '3D render, irigasi, pencahayaan',
    feePercentMin: 5,
    feePercentMax: 5,
    feePerSqmMin: 100_000,
    feePerSqmMax: 100_000,
    suitableFor: 'Villa, resort, komersial',
  },
  {
    id: 'kom-all',
    serviceName: 'Desain Komersial (Cafe/Resto)',
    category: 'Komersial',
    description: 'Full konsep interior + branding space',
    feePercentMin: 4,
    feePercentMax: 4,
    feePerSqmMin: 200_000,
    feePerSqmMax: 200_000,
    suitableFor: 'Termasuk 3D & RAB',
  },
  {
    id: 'pgw-all',
    serviceName: 'Pengawasan Konstruksi',
    category: 'Pengawasan',
    description: 'Site visit berkala, kontrol kualitas',
    feePercentMin: 3,
    feePercentMax: 5,
    feePerSqmMin: 100_000,
    feePerSqmMax: 200_000,
    suitableFor: 'Dari nilai RAB bangunan',
  },
]


// ============================================================
// CONSTANTS
// ============================================================
export const PPN_RATE = 0.11 // PPN 11%

// ============================================================
// SMART AUTO-MAPPING
// Map dari construction type → suggested design service
// ============================================================
export function getSuggestedServices(constructionType: string, tier: string): DesignServiceRate[] {
  const lower = constructionType.toLowerCase()
  const tierLower = tier.toLowerCase()

  // Cafe / Restoran → Komersial
  if (lower.includes('cafe') || lower.includes('resto')) {
    return designServiceRates.filter((s) => s.category === 'Komersial')
  }

  // Renovasi → Interior + Pengawasan
  if (lower.includes('renovasi')) {
    return designServiceRates.filter(
      (s) => s.category === 'Interior' || s.category === 'Pengawasan',
    )
  }

  // Villa Premium → Arsitektur + Lansekap
  if (lower.includes('villa') && tierLower.includes('premium')) {
    return designServiceRates.filter(
      (s) => s.category === 'Arsitektur' || s.category === 'Lansekap',
    )
  }

  // Ruko / Kantor → Arsitektur
  if (lower.includes('ruko') || lower.includes('kantor')) {
    return designServiceRates.filter((s) => s.category === 'Arsitektur')
  }

  // Default Rumah → Arsitektur dengan tier matching
  let suggestedTier: 'Standar' | 'Menengah' | 'Premium' = 'Standar'
  if (tierLower.includes('mewah') || tierLower.includes('premium')) suggestedTier = 'Premium'
  else if (tierLower.includes('menengah')) suggestedTier = 'Menengah'

  return designServiceRates.filter(
    (s) => s.category === 'Arsitektur' && s.tier === suggestedTier,
  )
}

// ============================================================
// CALCULATORS
// ============================================================
export function calculateRab(
  constructionTypeId: string,
  area: number,
): RabEstimate | null {
  const rate = constructionRates.find((r) => r.id === constructionTypeId)
  if (!rate || !area) return null

  const rabMin = rate.pricePerSqmMin * area
  const rabMax = rate.pricePerSqmMax * area
  const rabAvg = (rabMin + rabMax) / 2

  return {
    constructionType: rate.type,
    constructionTier: rate.tier,
    area,
    pricePerSqmMin: rate.pricePerSqmMin,
    pricePerSqmMax: rate.pricePerSqmMax,
    rabMin,
    rabMax,
    rabAvg,
    specification: rate.specification,
  }
}

export function calculateFee(
  serviceId: string,
  options: {
    mode: 'percentage' | 'per_sqm'
    rabValue?: number
    area?: number
    customPercent?: number
  },
): FeeEstimate | null {
  const service = designServiceRates.find((s) => s.id === serviceId)
  if (!service) return null

  let feeMin: number
  let feeMax: number
  let feePercent: number | undefined

  if (options.mode === 'percentage') {
    if (!options.rabValue) return null
    const pctMin = options.customPercent ?? service.feePercentMin
    const pctMax = options.customPercent ?? service.feePercentMax
    feeMin = (options.rabValue * pctMin) / 100
    feeMax = (options.rabValue * pctMax) / 100
    feePercent = options.customPercent ?? (pctMin + pctMax) / 2
  } else {
    if (!options.area) return null
    feeMin = service.feePerSqmMin * options.area
    feeMax = service.feePerSqmMax * options.area
  }

  const feeAvg = (feeMin + feeMax) / 2
  const ppn = feeAvg * PPN_RATE
  const totalMin = feeMin + feeMin * PPN_RATE
  const totalMax = feeMax + feeMax * PPN_RATE
  const totalAvg = feeAvg + ppn

  return {
    serviceName: service.serviceName,
    calculationMode: options.mode,
    feePercent,
    feeMin,
    feeMax,
    feeAvg,
    ppn,
    ppnRate: PPN_RATE,
    totalMin,
    totalMax,
    totalAvg,
  }
}

// ============================================================
// FORMATTERS
// ============================================================
export function formatIDR(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatIDRShort(num: number): string {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`
  if (num >= 1_000_000) return `Rp ${Math.round(num / 1_000_000)}jt`
  return formatIDR(num)
}

// ============================================================
// FUTURE: Google Sheets Integration
// ============================================================
export class PricingSheetService {
  private static webhookUrl =
    import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv1696073.hstgr.cloud/webhook'

  // Will replace mock data with live data from spreadsheet
  static async fetchConstructionRates(): Promise<ConstructionRate[]> {
    try {
      const res = await fetch(`${this.webhookUrl}/get-construction-rates`)
      if (!res.ok) throw new Error('Fetch failed')
      return await res.json()
    } catch {
      return constructionRates // fallback ke mock
    }
  }

  static async fetchDesignServiceRates(): Promise<DesignServiceRate[]> {
    try {
      const res = await fetch(`${this.webhookUrl}/get-design-service-rates`)
      if (!res.ok) throw new Error('Fetch failed')
      return await res.json()
    } catch {
      return designServiceRates // fallback ke mock
    }
  }
}
