'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  FileText, 
  Send,
  Check,
  X,
  Clock,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Mail
} from 'lucide-react'
import { QuoteService, type Quote } from '@/lib/services/quote-service'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import QuoteModal from '@/components/quotes/quote-modal'
import { DeleteQuoteModal } from '@/components/quotes/delete-quote-modal'
import { SendEmailModal } from '@/components/quotes/send-email-modal'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: Check },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: X },
  expired: { label: 'Expirada', color: 'bg-orange-100 text-orange-800', icon: Clock }
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Quote['status'] | ''>('')
  const [quoteModal, setQuoteModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    rejected: 0
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [quotesData, statsData] = await Promise.all([
        QuoteService.getQuotes({ limit: 100 }),
        QuoteService.getQuoteStats()
      ])
      
      setQuotes(quotesData.quotes)
      setStats({
        total: statsData.total,
        draft: statsData.byStatus.draft || 0,
        sent: statsData.byStatus.sent || 0,
        approved: statsData.byStatus.approved || 0,
        rejected: statsData.byStatus.rejected || 0
      })
    } catch (error) {
      console.error('Error loading quotes:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las cotizaciones'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuote = () => {
    setModalMode('create')
    setEditingQuote(null)
    setQuoteModal(true)
  }

  const handleEditQuote = async (quote: Quote) => {
    try {
      // Load quote with items
      const items = await QuoteService.getQuoteItems(quote.id!)
      const fullQuote = { ...quote, items }
      setEditingQuote(fullQuote)
      setModalMode('edit')
      setQuoteModal(true)
    } catch (error) {
      console.error('Error loading quote details:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los detalles de la cotización'
      })
    }
  }

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    quote: Quote | null
  }>({ isOpen: false, quote: null })

  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean
    quote: Quote | null
  }>({ isOpen: false, quote: null })

  const handleDeleteQuote = (quote: Quote) => {
    setDeleteModal({ isOpen: true, quote })
  }

  const handleSendEmail = (quote: Quote) => {
    setEmailModal({ isOpen: true, quote })
  }

  const handleDeleteConfirmed = () => {
    loadData()
  }

  const handleEmailSent = () => {
    loadData()
  }

  const handleQuoteSaved = (savedQuote: Quote) => {
    loadData() // Reload the data
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesStatus = statusFilter === '' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Cotizaciones
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona las cotizaciones de tus proyectos
              </p>
            </div>
            <Button size="sm" onClick={handleCreateQuote}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.total
                    )}
                  </div>
                  <div className="text-sm text-gray-600">cotizaciones creadas</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.draft
                    )}
                  </div>
                  <div className="text-sm text-gray-600">en preparación</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.sent
                    )}
                  </div>
                  <div className="text-sm text-gray-600">pendientes respuesta</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.approved
                    )}
                  </div>
                  <div className="text-sm text-gray-600">listas para procesar</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 text-purple-500 mr-3 flex items-center justify-center text-lg font-semibold">$</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                    ) : (
                      'USD 0.00'
                    )}
                  </div>
                  <div className="text-sm text-gray-600">valor cotizado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Cotizaciones</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">Total Cotizaciones</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-green-600">Tasa de Aprobación</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando cotizaciones...</span>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-gray-500">No se encontraron cotizaciones</span>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por cliente o notas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === '' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('')}
                      size="sm"
                    >
                      Todas
                    </Button>
                    <Button
                      variant={statusFilter === 'draft' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('draft')}
                      size="sm"
                    >
                      Borradores
                    </Button>
                    <Button
                      variant={statusFilter === 'sent' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('sent')}
                      size="sm"
                    >
                      Enviadas
                    </Button>
                    <Button
                      variant={statusFilter === 'approved' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('approved')}
                      size="sm"
                    >
                      Aprobadas
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>ITBMS</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes.map((quote) => {
                      const StatusIcon = statusConfig[quote.status].icon
                      return (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">
                            {quote.customers?.name || quote.work_orders?.customers?.name || 'Sin cliente'}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[quote.status as keyof typeof statusConfig].color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig[quote.status as keyof typeof statusConfig].label}
                            </Badge>
                          </TableCell>
                          <TableCell>v{quote.version}</TableCell>
                          <TableCell>{formatCurrency(quote.subtotal)}</TableCell>
                          <TableCell>{formatCurrency(quote.itbms_total)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(quote.total)}
                          </TableCell>
                          <TableCell>{formatDate(quote.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendEmail(quote)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Enviar por email"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteQuote(quote)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar cotización"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {quote.status === 'draft' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="Editar"
                                  onClick={() => handleEditQuote(quote)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteQuote(quote)}
                                className="text-red-500 hover:text-red-700"
                                title="Eliminar cotización"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Quote Modal */}
          <QuoteModal
            isOpen={quoteModal}
            onClose={() => {
              setQuoteModal(false)
              setEditingQuote(null)
            }}
            onSave={handleQuoteSaved}
            quote={editingQuote}
            mode={modalMode}
          />
          <DeleteQuoteModal
            isOpen={deleteModal.isOpen}
            quote={deleteModal.quote}
            onClose={() => setDeleteModal({ isOpen: false, quote: null })}
            onDeleted={handleDeleteConfirmed}
          />
          
          <SendEmailModal
            isOpen={emailModal.isOpen}
            quote={emailModal.quote}
            onClose={() => setEmailModal({ isOpen: false, quote: null })}
            onEmailSent={handleEmailSent}
          />
        </div>
      </MainLayout>
    )
}
