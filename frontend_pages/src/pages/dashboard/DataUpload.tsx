import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, FileUp, Loader2, UploadCloud, Clock } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useUploadPostings, useUploads } from '../../services/queries'
import { uploadsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtDateTime, fmtNum } from '../../lib/format'
import type { UploadStatus } from '../../types/api'

const STATUS: Record<UploadStatus, { label: string; tone: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', tone: 'bg-gray-100 text-gray-600', icon: Clock },
  processing: { label: 'Processing', tone: 'bg-primary-light text-navy', icon: Loader2 },
  completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'bg-red-50 text-red-600', icon: CircleAlert },
}

export default function DataUpload() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  const uploads = useUploads()
  const postings = useUploadPostings(openId)
  const upload = useMutation({
    mutationFn: (f: File) => uploadsApi.upload(f),
    onSuccess: () => {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      queryClient.invalidateQueries({ queryKey: ['sector'] })
    },
  })

  const pick = (f: File | undefined) => {
    setLocalError(null)
    upload.reset()
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setLocalError('Please choose a .csv file.')
      return
    }
    setFile(f)
  }

  const opened = uploads.data?.results.find((u) => u.id === openId)

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Job Postings Upload</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Upload a CSV of job postings. SkillSense classifies each row as ICT or not, maps ICT rows to the role
          taxonomy, and stores them. Data enters the platform only through this upload.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files[0]) }}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragOver ? 'border-primary bg-primary-light/40' : 'border-gray-200 bg-gray-50/60'}`}
        >
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="text-sm font-semibold text-gray-700">Drag a CSV here, or</p>
          <input ref={inputRef} id="csv-input" data-testid="csv-input" type="file" accept=".csv,text/csv" onChange={(e) => pick(e.target.files?.[0])} className="sr-only" />
          <label htmlFor="csv-input" className="cursor-pointer rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-navy shadow-sm hover:bg-gray-50">Choose file</label>
          <p className="max-w-lg text-xs text-gray-400">
            Required column: <code className="rounded bg-gray-100 px-1">title</code>. Optional: source, company, location_raw, industry_raw, education_raw, experience_raw, contract_type_raw, description.
          </p>
        </div>

        {file && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 px-5 py-4">
            <span className="flex items-center gap-3 text-sm font-semibold text-gray-800"><FileUp className="h-5 w-5 text-primary" />{file.name}<span className="text-xs font-normal text-gray-400">{(file.size / 1024).toFixed(1)} KB</span></span>
            <button onClick={() => upload.mutate(file)} disabled={upload.isPending} className="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-dark-navy disabled:opacity-60">
              {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {upload.isPending ? 'Uploading…' : 'Upload & process'}
            </button>
          </div>
        )}
        {(localError || upload.isError) && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">{localError ?? (upload.error instanceof ApiError ? upload.error.message : 'Upload failed.')}</p>
        )}
        {upload.isSuccess && <p data-testid="upload-ok" className="mt-4 text-sm font-medium text-emerald-700">File accepted. Processing has started.</p>}
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">Upload History</h2>
        <Card className="mt-5 overflow-x-auto">
          <QueryGate query={uploads} className="m-6">
            {(u) =>
              u.results.length === 0 ? (
                <EmptyState title="No uploads yet" hint="Uploaded files and their processing results will appear here." className="m-6" />
              ) : (
                <table className="w-full min-w-[720px] text-left" data-testid="upload-table">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-bold">File</th><th className="px-6 py-4 font-bold">Uploaded</th><th className="px-6 py-4 font-bold">Rows</th><th className="px-6 py-4 font-bold">ICT</th><th className="px-6 py-4 font-bold">Errors</th><th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {u.results.map((r) => {
                      const s = STATUS[r.status]
                      return (
                        <tr key={r.id} onClick={() => setOpenId(r.id)} className={`cursor-pointer text-sm hover:bg-gray-50 ${openId === r.id ? 'bg-primary-light/40' : ''}`}>
                          <td className="px-6 py-4 font-bold text-gray-900">{r.original_filename}</td>
                          <td className="px-6 py-4 text-gray-600">{fmtDateTime(r.created_at)}</td>
                          <td className="px-6 py-4 text-gray-700">{r.total_records}</td>
                          <td className="px-6 py-4 text-gray-700">{r.ict_records}</td>
                          <td className="px-6 py-4 text-gray-700">{r.error_count}</td>
                          <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${s.tone}`}><s.icon className={`h-3.5 w-3.5 ${r.status === 'processing' ? 'animate-spin' : ''}`} />{s.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            }
          </QueryGate>
        </Card>
      </div>

      {opened && (
        <Card className="mt-6 p-6" data-testid="upload-detail">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">{opened.original_filename}</h2>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">{opened.processing_log || 'No processing log yet.'}</pre>
          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Postings from this file</h3>
          <QueryGate query={postings} className="mt-3">
            {(p) => (
              <div className="mt-3 max-h-96 overflow-auto">
                <table className="w-full min-w-[640px] text-left" data-testid="postings-table">
                  <thead><tr className="sticky top-0 border-b border-gray-200 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Title</th><th className="pb-3 font-bold">Company</th><th className="pb-3 font-bold">ICT</th><th className="pb-3 font-bold">Mapped role</th><th className="pb-3 font-bold">Confidence</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {p.results.map((x) => (
                      <tr key={x.id} className="text-sm"><td className="py-2.5 pr-3 font-medium text-gray-900">{x.title}</td><td className="py-2.5 pr-3 text-gray-600">{x.company || '-'}</td><td className="py-2.5 pr-3">{x.is_ict ? <span className="font-bold text-emerald-600">Yes</span> : <span className="text-gray-400">No</span>}</td><td className="py-2.5 pr-3 text-gray-700">{x.normalized_role_name ?? '-'}</td><td className="py-2.5 text-gray-600">{fmtNum(x.ict_role_confidence * 100, 0)}%</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-400">{p.count} posting{p.count === 1 ? '' : 's'}</p>
              </div>
            )}
          </QueryGate>
        </Card>
      )}
    </DashboardLayout>
  )
}
