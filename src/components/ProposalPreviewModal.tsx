import React, { useMemo, useRef } from 'react'
import { ProposalData, buildProposalHTML } from '../services/proposalTemplate'

interface Props {
  data: ProposalData
  onClose: () => void
  onSave?: () => void
  saving?: boolean
  saved?: boolean
}

const ProposalPreviewModal: React.FC<Props> = ({ data, onClose, onSave, saving, saved }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const html = useMemo(() => buildProposalHTML(data), [data])

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow
    if (win) {
      win.focus()
      win.print()
    }
  }

  const handleDownloadHTML = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Proposal-${data.proposalNo || 'SudutRuang'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-brand-dark/60 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-sm px-sm md:px-md h-14 bg-surface border-b border-outline-variant flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
          aria-label="Tutup preview"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-[15px] font-semibold truncate">Preview Proposal</h3>
        <span className="hidden sm:inline text-[12px] text-outline font-mono-label truncate">
          {data.proposalNo}
        </span>

        <div className="flex-1" />

        <button
          onClick={handleDownloadHTML}
          className="hidden sm:flex items-center gap-xs py-2 px-md border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          HTML
        </button>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-xs py-2 px-md border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? 'hourglass_empty' : saved ? 'check_circle' : 'save'}
            </span>
            {saved ? 'Tersimpan' : saving ? 'Menyimpan' : 'Simpan'}
          </button>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-xs py-2 px-md bg-brand text-white rounded-lg text-[13px] font-bold hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Cetak / PDF
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 bg-[#f7f7f7]">
        <iframe
          ref={iframeRef}
          title="Proposal Preview"
          srcDoc={html}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}

export default ProposalPreviewModal
