'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Eye, Calendar, Filter, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { DateInput } from '@/components/ui/DateInput'
import { Label } from '@/components/ui/Label'
import { showError } from '@/components/ui/Toast'
import ModalDetalhesExame from '../../components/ModalDetalhesExame'

interface Exame {
  id: string
  tipo: number | null
  status: number | null
  data_exame: string
  ido: number | null
  ido_categoria: number | null
  score_ronco: number | null
  biologix_exam_key: string | null
  created_at: string
}

interface TabExamesProps {
  pacienteId: string
}

export default function TabExames({ pacienteId }: TabExamesProps) {
  const [exames, setExames] = useState<Exame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedExame, setSelectedExame] = useState<Exame | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ronco' | 'sono'>('todos')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single()
        if (userData) {
          setUserRole(userData.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchExames()
  }, [pacienteId, filtroTipo, filtroDataInicio, filtroDataFim])

  const fetchExames = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('exames')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_exame', { ascending: false })

      // Aplicar filtro de tipo
      if (filtroTipo === 'ronco') {
        query = query.eq('tipo', 0)
      } else if (filtroTipo === 'sono') {
        query = query.eq('tipo', 1)
      }

      // Aplicar filtro de data
      if (filtroDataInicio) {
        query = query.gte('data_exame', filtroDataInicio)
      }
      if (filtroDataFim) {
        query = query.lte('data_exame', filtroDataFim)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar exames:', error)
        showError('Erro ao carregar exames')
        return
      }

      setExames(data || [])
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao carregar exames')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    // Fix timezone issue: parse date as local date, not UTC
    // dateString is in format "YYYY-MM-DD" from PostgreSQL DATE type
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed in JavaScript
    return date.toLocaleDateString('pt-BR')
  }

  const getTipoLabel = (tipo: number | null) => {
    if (tipo === 0) return 'Ronco'
    if (tipo === 1) return 'Sono'
    return '-'
  }

  const getStatusLabel = (status: number | null) => {
    if (status === 6) return 'Concluído'
    return 'Pendente'
  }

  const getIDOCategoriaLabel = (categoria: number | null) => {
    if (categoria === 0) return 'Normal'
    if (categoria === 1) return 'Leve'
    if (categoria === 2) return 'Moderado'
    if (categoria === 3) return 'Acentuado'
    return '-'
  }

  const getIDOCategoriaColor = (categoria: number | null) => {
    if (categoria === 0) return 'bg-success-100 text-success-800 border-success-200'
    if (categoria === 1) return 'bg-warning-100 text-warning-800 border-warning-200'
    if (categoria === 2) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (categoria === 3) return 'bg-danger-100 text-danger-800 border-danger-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const isNovo = (createdAt: string) => {
    const created = new Date(createdAt)
    const hoje = new Date()
    const diffTime = Math.abs(hoje.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  const handleBaixarPDF = async (examKey: string | null, exameId: string) => {
    if (!examKey || !examKey.trim()) {
      showError('Chave do exame não disponível. O PDF pode não estar disponível para este exame.')
      return
    }

    const trimmedKey = examKey.trim()
    const pdfUrl = `https://api.biologixsleep.com/v2/exams/${trimmedKey}/files/report.pdf`
    
    // Verificar se o PDF existe antes de abrir
    try {
      // Tentar fazer uma requisição GET para verificar se o PDF existe
      const response = await fetch(pdfUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      })
      
      if (response.status === 404) {
        // PDF não encontrado - redirecionar para página de erro
        const errorUrl = `/erro-pdf?examKey=${encodeURIComponent(trimmedKey)}&exameId=${encodeURIComponent(exameId)}`
        window.open(errorUrl, '_blank')
        return
      }
      
      // Verificar se a resposta é um PDF válido
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/pdf')) {
        // PDF válido encontrado, abrir em nova aba
        const newWindow = window.open(pdfUrl, '_blank')
        if (!newWindow) {
          showError('Não foi possível abrir o PDF. Verifique se os pop-ups estão bloqueados.')
        }
      } else if (contentType && contentType.includes('application/json')) {
        // A API retornou JSON (erro), redirecionar para página de erro
        const errorUrl = `/erro-pdf?examKey=${encodeURIComponent(trimmedKey)}&exameId=${encodeURIComponent(exameId)}`
        window.open(errorUrl, '_blank')
      } else {
        // Resposta inesperada, tentar abrir mesmo assim
        const newWindow = window.open(pdfUrl, '_blank')
        if (!newWindow) {
          showError('Não foi possível abrir o PDF. Verifique se os pop-ups estão bloqueados.')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar PDF:', error)
      // Em caso de erro de CORS ou rede, tentar abrir mesmo assim
      const newWindow = window.open(pdfUrl, '_blank')
      if (!newWindow) {
        showError('Não foi possível abrir o PDF. Verifique se os pop-ups estão bloqueados.')
      }
    }
  }

  const handleVerDetalhes = (exame: Exame) => {
    setSelectedExame(exame)
    setShowDetalhesModal(true)
  }

  const canDownloadPDF = userRole !== 'recepcao'
  const canManageExames = userRole === 'admin' || userRole === 'equipe'

  const handleDeleteExame = async (exame: Exame) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o exame de ${formatDate(exame.data_exame)}? Esta ação não pode ser desfeita.`
    )
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('exames')
        .delete()
        .eq('id', exame.id)

      if (error) {
        console.error('Erro ao deletar exame:', error)
        showError('Erro ao deletar exame. Verifique suas permissões.')
        return
      }

      await fetchExames()
    } catch (error) {
      console.error('Erro inesperado ao deletar exame:', error)
      showError('Erro inesperado ao deletar exame')
    }
  }

  return (
    <>
      <Card data-tour="paciente-exames">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exames</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{exames.length} exame(s)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium text-gray-700">Filtros</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro Tipo */}
              <div>
                <Label htmlFor="filtro_tipo" className="text-xs text-gray-600 mb-1 block">
                  Tipo
                </Label>
                <select
                  id="filtro_tipo"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'ronco' | 'sono')}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="todos">Todos</option>
                  <option value="ronco">Ronco</option>
                  <option value="sono">Sono</option>
                </select>
              </div>

              {/* Filtro Data Início */}
              <div>
                <Label htmlFor="filtro_data_inicio" className="text-xs text-gray-600 mb-1 block">
                  Data Início
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                  <DateInput
                    id="filtro_data_inicio"
                    value={filtroDataInicio}
                    onChange={(value) => setFiltroDataInicio(value)}
                    displayFormat="DD/MM/YYYY"
                    placeholder="DD/MM/AAAA"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro Data Fim */}
              <div>
                <Label htmlFor="filtro_data_fim" className="text-xs text-gray-600 mb-1 block">
                  Data Fim
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                  <DateInput
                    id="filtro_data_fim"
                    value={filtroDataFim}
                    onChange={(value) => setFiltroDataFim(value)}
                    displayFormat="DD/MM/YYYY"
                    placeholder="DD/MM/AAAA"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando exames...</p>
            </div>
          ) : exames.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum exame encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IDO</TableHead>
                    <TableHead>Score Ronco</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exames.map((exame) => (
                    <TableRow key={exame.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{formatDate(exame.data_exame)}</span>
                          {isNovo(exame.created_at) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
                              Novo
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{getTipoLabel(exame.tipo)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{getStatusLabel(exame.status)}</span>
                      </TableCell>
                      <TableCell>
                        {exame.ido !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{exame.ido.toFixed(1)}</span>
                            {exame.ido_categoria !== null && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getIDOCategoriaColor(
                                  exame.ido_categoria
                                )}`}
                              >
                                {getIDOCategoriaLabel(exame.ido_categoria)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exame.score_ronco !== null ? (
                          <span className="text-sm font-medium text-gray-900">
                            {exame.score_ronco.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerDetalhes(exame)}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canDownloadPDF && exame.biologix_exam_key && exame.biologix_exam_key.trim() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBaixarPDF(exame.biologix_exam_key, exame.id)}
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {canManageExames && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExame(exame)}
                              title="Deletar Exame"
                              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detalhes Exame */}
      {selectedExame && (
        <ModalDetalhesExame
          isOpen={showDetalhesModal}
          onClose={() => {
            setShowDetalhesModal(false)
            setSelectedExame(null)
          }}
          exameId={selectedExame.id}
          canDownloadPDF={canDownloadPDF}
          canEditExame={canManageExames}
        />
      )}
    </>
  )
}

