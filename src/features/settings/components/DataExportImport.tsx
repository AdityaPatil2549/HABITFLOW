import { type FC, useState, useRef, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { exportData, exportToCSV, importData, downloadFile, readFile } from '../utils/dataExport'
import { cn } from '@/shared/utils/cn'

export const DataExportImport: FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = async () => {
    setIsLoading(true)
    try {
      const data = await exportData()
      downloadFile(data, `habitflow-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      setStatus({ type: 'success', message: 'Data exported successfully!' })
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to export data' })
    }
    setIsLoading(false)
  }

  const handleExportCSV = async () => {
    setIsLoading(true)
    try {
      const { habits, tasks } = await exportToCSV()
      downloadFile(habits, `habitflow-habits-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      downloadFile(tasks, `habitflow-tasks-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      setStatus({ type: 'success', message: 'CSV files exported!' })
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to export CSV' })
    }
    setIsLoading(false)
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const content = await readFile(file)
      const success = await importData(content)
      if (success) {
        setStatus({ type: 'success', message: 'Data imported successfully!' })
        window.location.reload()
      } else {
        setStatus({ type: 'error', message: 'Failed to import data. Invalid format.' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error reading file' })
    }
    setIsLoading(false)
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Data Management</h3>
            <p className="text-sm text-muted-foreground">
              Backup and restore your data
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Manage Data
          </Button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Data Export & Import" size="lg">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <button
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'export'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-muted-foreground hover:text-text'
              )}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
            <button
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'import'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-muted-foreground hover:text-text'
              )}
              onClick={() => setActiveTab('import')}
            >
              Import
            </button>
          </div>

          {/* Status */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center space-x-2 p-3 rounded-lg',
                status.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              )}
            >
              {status.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{status.message}</span>
            </motion.div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Export your data as JSON (full backup) or CSV (spreadsheets).
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={handleExportJSON}
                  disabled={isLoading}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-brand-500 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <FileJson className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Export as JSON</p>
                    <p className="text-sm text-muted-foreground">Full backup</p>
                  </div>
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={isLoading}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-success transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Export as CSV</p>
                    <p className="text-sm text-muted-foreground">For spreadsheets</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning">
                    <p className="font-medium">Warning</p>
                    <p>Importing will replace all existing data. Make sure to backup first!</p>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground">
                Select a JSON backup file to restore your data.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-brand-500 transition-all"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Click to select file</span>
              </button>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
