// Pricing types untuk Sudut Ruang
// Source: Google Spreadsheet (Fee Jasa Arsitek + RAB Konstruksi)

export interface ConstructionRate {
  id: string
  type: string // Rumah Tinggal, Ruko, Cafe, etc
  tier: string // Ekonomi, Standar, Premium, etc
  pricePerSqmMin: number
  pricePerSqmMax: number
  specification: string
  notes: string
}

export interface DesignServiceRate {
  id: string
  serviceName: string
  category: 'Arsitektur' | 'Interior' | 'Lansekap' | 'Komersial' | 'Pengawasan'
  tier?: 'Standar' | 'Menengah' | 'Premium'
  description: string
  feePercentMin: number // dalam persen (5 = 5%)
  feePercentMax: number
  feePerSqmMin: number
  feePerSqmMax: number
  suitableFor: string
}

export interface RabEstimate {
  constructionType: string
  constructionTier: string
  area: number
  pricePerSqmMin: number
  pricePerSqmMax: number
  rabMin: number
  rabMax: number
  rabAvg: number
  specification: string
}

export interface FeeEstimate {
  serviceName: string
  calculationMode: 'percentage' | 'per_sqm'
  feePercent?: number
  feeMin: number
  feeMax: number
  feeAvg: number
  ppn: number
  ppnRate: number
  totalMin: number
  totalMax: number
  totalAvg: number
}

export interface FullEstimate {
  rab: RabEstimate
  fee: FeeEstimate
  generatedAt: Date
  projectName?: string
  clientName?: string
}
