'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Calendar, Scale, Ruler, Activity, Heart, FileText, Clock, Pill, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { showError, showSuccess } from '@/components/ui/Toast'
import GaugeChart from '@/components/ui/GaugeChart'
import HistogramChart from '@/components/ui/HistogramChart'
import RiskBar from '@/components/ui/RiskBar'

interface Exame {
  id: string
  tipo: number | null
  status: number | null
  data_exame: string
  duracao_seg: number | null
  hora_inicio: string | null
  hora_fim: string | null
  duracao_total_seg: number | null
  duracao_valida_seg: number | null
  peso_kg: number | null
  altura_cm: number | null
  imc: number | null
  // Condições
  consumo_alcool: boolean | null
  congestao_nasal: boolean | null
  sedativos: boolean | null
  placa_bruxismo: boolean | null
  marcapasso: boolean | null
  // Tratamentos
  cpap: boolean | null
  aparelho_avanco: boolean | null
  terapia_posicional: boolean | null
  oxigenio: boolean | null
  suporte_ventilatorio: boolean | null
  // Ficha médica
  condicoes: string | null
  sintomas: string | null
  doencas: string | null
  medicamentos: string | null
  // Ronco
  score_ronco: number | null
  ronco_silencio_pct: number | null
  ronco_baixo_pct: number | null
  ronco_medio_pct: number | null
  ronco_alto_pct: number | null
  ronco_duracao_seg: number | null
  // Oximetria
  ido: number | null
  ido_sono: number | null
  ido_categoria: number | null
  spo2_min: number | null
  spo2_avg: number | null
  spo2_max: number | null
  tempo_spo2_90_seg: number | null
  tempo_spo2_80_seg: number | null
  num_dessaturacoes: number | null
  num_eventos_hipoxemia: number | null
  tempo_hipoxemia_seg: number | null
  carga_hipoxica: number | null
  // Frequência cardíaca
  bpm_min: number | null
  bpm_medio: number | null
  bpm_max: number | null
  // Sono
  tempo_sono_seg: number | null
  tempo_dormir_seg: number | null
  tempo_acordado_seg: number | null
  eficiencia_sono_pct: number | null
  // Histogramas
  spo2_histograma: any | null
  bpm_histograma: any | null
  // Cardiologia
  fibrilacao_atrial: number | null
  biologix_exam_key: string | null
}

interface ModalDetalhesExameProps {
  isOpen: boolean
  onClose: () => void
  exameId: string
  canDownloadPDF?: boolean
  canEditExame?: boolean
}

export default function ModalDetalhesExame({
  isOpen,
  onClose,
  exameId,
  canDownloadPDF = true,
  canEditExame = false,
}: ModalDetalhesExameProps) {
  const [exame, setExame] = useState<Exame | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState<Partial<Exame>>({})

  useEffect(() => {
    if (isOpen && exameId) {
      fetchExame()
    }
  }, [isOpen, exameId])

  const fetchExame = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('exames')
        .select('*')
        .eq('id', exameId)
        .single()

      if (error) {
        console.error('Erro ao buscar exame:', error)
        showError('Erro ao carregar detalhes do exame')
        return
      }

      setExame(data)
      setEditedData({}) // Reset edited data when loading new exam
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao carregar exame')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckboxChange = (field: keyof Exame, value: boolean) => {
    if (!exame) return
    
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const hasChanges = () => {
    if (!exame) return false
    return Object.keys(editedData).length > 0
  }

  const handleSave = async () => {
    if (!exame || !hasChanges()) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('exames')
        .update(editedData)
        .eq('id', exame.id)

      if (error) {
        console.error('Erro ao salvar exame:', error)
        showError('Erro ao salvar alterações do exame')
        return
      }

      // Update local state
      setExame(prev => prev ? { ...prev, ...editedData } : null)
      setEditedData({})
      showSuccess('Alterações salvas com sucesso!')
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao salvar exame')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({})
  }

  const getCheckboxValue = (field: keyof Exame): boolean => {
    if (!exame) return false
    return editedData[field] !== undefined 
      ? (editedData[field] as boolean) 
      : (exame[field] as boolean) || false
  }

  const formatDate = (dateString: string) => {
    // Fix timezone issue: if date is in "YYYY-MM-DD" format (DATE type), parse as local
    let date: Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // DATE type - parse as local date to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number)
      date = new Date(year, month - 1, day) // month is 0-indexed
    } else {
      // TIMESTAMP type - use normal parsing
      date = new Date(dateString)
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (segundos: number | null) => {
    if (!segundos) return '-'
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    return `${horas}h ${minutos}min`
  }

  const getTipoLabel = (tipo: number | null) => {
    if (tipo === 0) return 'Teste do Ronco'
    if (tipo === 1) return 'Exame do Sono'
    return '-'
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

  const getFibrilacaoColor = (valor: number | null) => {
    if (valor === 1) return 'bg-danger-100 text-danger-800 border-danger-200'
    if (valor === 0) return 'bg-success-100 text-success-800 border-success-200'
    if (valor && valor < 0) return 'bg-warning-100 text-warning-800 border-warning-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getFibrilacaoLabel = (valor: number | null) => {
    if (valor === 0) return 'Negativa'
    if (valor === 1) return 'Positiva'
    if (valor && valor < 0) return 'Inconclusivo'
    return '-'
  }

  const handleBaixarPDF = async () => {
    if (!exame?.biologix_exam_key) {
      showError('Chave do exame não disponível. Este exame pode ter sido migrado do Airtable e não possui chave para download do PDF.')
      return
    }

    // Verificar se o examKey não está vazio
    const examKey = exame.biologix_exam_key.trim()
    if (!examKey) {
      showError('Chave do exame inválida. Este exame pode não ter o PDF disponível.')
      return
    }

    const pdfUrl = `https://api.biologixsleep.com/v2/exams/${examKey}/files/report.pdf`
    
    // Verificar se o exame está completo (status = 6 = DONE)
    if (exame.status !== 6) {
      const confirmOpen = window.confirm(
        `Este exame ainda não está completo (Status: ${exame.status}). O PDF pode não estar disponível. Deseja tentar baixar mesmo assim?`
      )
      if (!confirmOpen) {
        return
      }
    }
    
    // Verificar se o PDF existe antes de abrir
    // Isso evita que o usuário veja o JSON de erro da API
    try {
      // Tentar fazer uma requisição GET para verificar se o PDF existe
      // Usamos GET em vez de HEAD para evitar problemas de CORS
      const response = await fetch(pdfUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      })
      
      if (response.status === 404) {
        // PDF não encontrado - redirecionar para página de erro
        const errorUrl = `/erro-pdf?examKey=${encodeURIComponent(examKey)}&exameId=${encodeURIComponent(exame.id)}`
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
        const errorUrl = `/erro-pdf?examKey=${encodeURIComponent(examKey)}&exameId=${encodeURIComponent(exame.id)}`
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
      // Se der erro 404, o usuário verá o JSON de erro, mas pelo menos tentamos
      const newWindow = window.open(pdfUrl, '_blank')
      if (!newWindow) {
        showError('Não foi possível abrir o PDF. Verifique se os pop-ups estão bloqueados.')
      }
    }
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Detalhes do Exame</DialogTitle>
          </DialogHeader>
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-sm text-gray-600">Carregando detalhes do exame...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!exame) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200 bg-gray-50/50">
          <DialogTitle className="text-xl font-semibold text-gray-900">Detalhes do Exame</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Informações completas do exame do paciente
          </DialogDescription>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-scroll overflow-x-hidden px-6 py-6 custom-scrollbar"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
            maxHeight: 'calc(95vh - 200px)',
            minHeight: 0
          }}
        >
          <div className="space-y-6 pb-4">
          
          {/* Seção 1: Cabeçalho do Exame */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-primary-600" />
                Cabeçalho do Exame
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Data do Exame</p>
                  <div className="flex items-center gap-2 min-w-[220px]">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <DateInput
                      value={
                        typeof editedData.data_exame === 'string'
                          ? editedData.data_exame
                          : exame.data_exame
                      }
                      onChange={(value) => {
                        if (!canEditExame) return
                        setEditedData((prev) => ({
                          ...prev,
                          data_exame: value,
                        }))
                      }}
                      displayFormat="DD/MM/YYYY"
                      placeholder="DD/MM/AAAA"
                      disabled={!canEditExame || isSaving}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Tipo</p>
                  <p className="text-sm font-semibold text-gray-900">{getTipoLabel(exame.tipo)}</p>
                </div>
                {exame.hora_inicio && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Início</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">{formatDateTime(exame.hora_inicio)}</p>
                    </div>
                  </div>
                )}
                {exame.hora_fim && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Fim</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">{formatDateTime(exame.hora_fim)}</p>
                    </div>
                  </div>
                )}
                {exame.duracao_total_seg && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Tempo Total</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDuration(exame.duracao_total_seg)}</p>
                  </div>
                )}
                {exame.duracao_valida_seg && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Tempo Válido</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDuration(exame.duracao_valida_seg)}</p>
                  </div>
                )}
                {exame.duracao_seg && !exame.duracao_total_seg && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Duração</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDuration(exame.duracao_seg)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Condições na Noite do Exame */}
          {(exame.consumo_alcool !== null || exame.congestao_nasal !== null || exame.sedativos !== null || 
            exame.placa_bruxismo !== null || exame.marcapasso !== null) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <AlertCircle className="h-5 w-5 text-primary-600" />
                  Condições na Noite do Exame
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start">
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('consumo_alcool')}
                        onChange={(e) => handleCheckboxChange('consumo_alcool', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('consumo_alcool')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('consumo_alcool') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('consumo_alcool') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Consumo de Álcool</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('congestao_nasal')}
                        onChange={(e) => handleCheckboxChange('congestao_nasal', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('congestao_nasal')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('congestao_nasal') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('congestao_nasal') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Congestão Nasal</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('sedativos')}
                        onChange={(e) => handleCheckboxChange('sedativos', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('sedativos')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('sedativos') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('sedativos') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Sedativos</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('placa_bruxismo')}
                        onChange={(e) => handleCheckboxChange('placa_bruxismo', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('placa_bruxismo')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('placa_bruxismo') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('placa_bruxismo') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Placa de Bruxismo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('marcapasso')}
                        onChange={(e) => handleCheckboxChange('marcapasso', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('marcapasso')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('marcapasso') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('marcapasso') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Marcapasso</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 3: Tratamentos na Noite do Exame */}
          {(exame.cpap !== null || exame.aparelho_avanco !== null || exame.terapia_posicional !== null || 
            exame.oxigenio !== null || exame.suporte_ventilatorio !== null) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Pill className="h-5 w-5 text-primary-600" />
                  Tratamentos na Noite do Exame
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start">
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('cpap')}
                        onChange={(e) => handleCheckboxChange('cpap', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('cpap')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('cpap') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('cpap') ? 'text-gray-900' : 'text-gray-600'
                    }`}>CPAP</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('aparelho_avanco')}
                        onChange={(e) => handleCheckboxChange('aparelho_avanco', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('aparelho_avanco')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('aparelho_avanco') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('aparelho_avanco') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Aparelho de Avanço</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('terapia_posicional')}
                        onChange={(e) => handleCheckboxChange('terapia_posicional', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('terapia_posicional')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('terapia_posicional') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('terapia_posicional') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Terapia Posicional</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('oxigenio')}
                        onChange={(e) => handleCheckboxChange('oxigenio', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('oxigenio')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('oxigenio') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('oxigenio') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Oxigênio</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={getCheckboxValue('suporte_ventilatorio')}
                        onChange={(e) => handleCheckboxChange('suporte_ventilatorio', e.target.checked)}
                        disabled={!canEditExame || isSaving}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        getCheckboxValue('suporte_ventilatorio')
                          ? 'bg-primary-600 border-primary-600 shadow-sm' 
                          : 'bg-white border-gray-300 group-hover:border-primary-400'
                      }`}>
                        {getCheckboxValue('suporte_ventilatorio') && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium select-none ${
                      getCheckboxValue('suporte_ventilatorio') ? 'text-gray-900' : 'text-gray-600'
                    }`}>Suporte Ventilatório</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 4: Ficha Médica */}
          {(exame.peso_kg !== null || exame.altura_cm !== null || exame.imc !== null || 
            exame.medicamentos || exame.sintomas || exame.doencas) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5 text-primary-600" />
                  Ficha Médica
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                    {exame.peso_kg !== null && exame.peso_kg !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Peso</p>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{Number(exame.peso_kg)} kg</p>
                        </div>
                      </div>
                    )}
                    {exame.altura_cm !== null && exame.altura_cm !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Altura</p>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{Number(exame.altura_cm)} cm</p>
                        </div>
                      </div>
                    )}
                    {exame.imc !== null && exame.imc !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IMC</p>
                        <p className="text-sm font-medium text-gray-900">{Number(exame.imc).toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                  {exame.medicamentos && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Medicamentos</p>
                      <p className="text-sm text-gray-900">{exame.medicamentos}</p>
                    </div>
                  )}
                  {exame.sintomas && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sintomas</p>
                      <p className="text-sm text-gray-900">{exame.sintomas}</p>
                    </div>
                  )}
                  {exame.doencas && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Doenças Associadas</p>
                      <p className="text-sm text-gray-900">{exame.doencas}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 10: Análise de Ronco (apenas para Teste do Ronco) */}
          {exame.tipo === 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary-600" />
                  Análise de Ronco
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Score de Ronco com Gauge */}
                  {exame.score_ronco !== null && exame.score_ronco !== undefined && (
                    <div className="flex flex-col items-center">
                      <GaugeChart
                        value={exame.score_ronco}
                        max={3}
                        label="Score de Ronco"
                        unit="pontos"
                        color={
                          (exame.score_ronco || 0) < 1 ? 'green' :
                          (exame.score_ronco || 0) < 2 ? 'yellow' :
                          (exame.score_ronco || 0) < 2.5 ? 'orange' : 'red'
                        }
                        size="lg"
                      />
                      <div className="mt-4 text-xs text-gray-500 text-center">
                        <p>Baixo: 0-1 | Médio: 1-2 | Alto: 2-2.5 | Muito Alto: 2.5+</p>
                      </div>
                    </div>
                  )}

                  {/* Métricas de Ronco */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start">
                    {exame.ronco_duracao_seg && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duração Total</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.ronco_duracao_seg)}</p>
                      </div>
                    )}
                    {exame.ronco_silencio_pct !== null && exame.ronco_silencio_pct !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">% Silêncio</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.ronco_silencio_pct).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.ronco_baixo_pct !== null && exame.ronco_baixo_pct !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">% Baixo</p>
                        <p className="text-lg font-semibold text-green-600">{Number(exame.ronco_baixo_pct).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.ronco_medio_pct !== null && exame.ronco_medio_pct !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">% Médio</p>
                        <p className="text-lg font-semibold text-yellow-600">{Number(exame.ronco_medio_pct).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.ronco_alto_pct !== null && exame.ronco_alto_pct !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">% Alto</p>
                        <p className="text-lg font-semibold text-red-600">{Number(exame.ronco_alto_pct).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Histograma de Ronco */}
                  {(exame.ronco_silencio_pct !== null || exame.ronco_baixo_pct !== null || 
                    exame.ronco_medio_pct !== null || exame.ronco_alto_pct !== null) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Distribuição de Intensidade de Ronco</p>
                      <HistogramChart
                        data={[
                          { label: 'Silêncio', value: exame.ronco_silencio_pct || 0, color: 'bg-gray-300' },
                          { label: 'Baixo', value: exame.ronco_baixo_pct || 0, color: 'bg-green-500' },
                          { label: 'Médio', value: exame.ronco_medio_pct || 0, color: 'bg-yellow-500' },
                          { label: 'Alto', value: exame.ronco_alto_pct || 0, color: 'bg-red-500' },
                        ].filter(item => item.value > 0)}
                        maxValue={100}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 5: Resultado Principal com Gauges (apenas para Polissonografia) */}
          {exame.tipo === 1 && (exame.ido !== null || exame.tempo_spo2_90_seg !== null) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary-600" />
                  Resultado Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const temIDO = exame.ido !== null && exame.ido !== undefined
                  const temSpo2_90 = exame.tempo_spo2_90_seg !== null && exame.duracao_total_seg !== null
                  const temAmbos = temIDO && temSpo2_90
                  
                  if (!temIDO && !temSpo2_90) return null
                  
                  return (
                    <div className={`grid gap-8 ${temAmbos ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 justify-items-center'}`}>
                      {temIDO && exame.ido !== null && (
                        <div className={temAmbos ? '' : 'max-w-md w-full'}>
                          <GaugeChart
                            value={exame.ido}
                            max={60}
                            label="IDO (Índice de Dessaturação de Oxigênio)"
                            unit="eventos/hora"
                            color={
                              exame.ido_categoria === 0 ? 'green' :
                              exame.ido_categoria === 1 ? 'yellow' :
                              exame.ido_categoria === 2 ? 'orange' : 'red'
                            }
                            size="lg"
                          />
                          {exame.ido_categoria !== null && (
                            <div className="mt-2 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getIDOCategoriaColor(
                                  exame.ido_categoria
                                )}`}
                              >
                                {getIDOCategoriaLabel(exame.ido_categoria)}
                              </span>
                            </div>
                          )}
                          <div className="mt-4 text-xs text-gray-500 text-center">
                            <p>Normal: 0-5 | Leve: 5-15 | Moderado: 15-30 | Acentuado: 30+</p>
                          </div>
                        </div>
                      )}
                      {temSpo2_90 && exame.tempo_spo2_90_seg !== null && exame.duracao_total_seg !== null && (
                        <div className={temAmbos ? '' : 'max-w-md w-full'}>
                          <GaugeChart
                            value={(exame.tempo_spo2_90_seg / exame.duracao_total_seg) * 100}
                            max={100}
                            label="Tempo com SpO2 < 90%"
                            unit="%"
                            color={
                              (exame.tempo_spo2_90_seg / exame.duracao_total_seg) * 100 < 5 ? 'green' :
                              (exame.tempo_spo2_90_seg / exame.duracao_total_seg) * 100 < 10 ? 'yellow' :
                              (exame.tempo_spo2_90_seg / exame.duracao_total_seg) * 100 < 20 ? 'orange' : 'red'
                            }
                            size="lg"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-sm text-gray-600">
                              {formatDuration(exame.tempo_spo2_90_seg)} de {formatDuration(exame.duracao_total_seg)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Seção 6: Oximetria Completa (apenas para Polissonografia) */}
          {exame.tipo === 1 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Heart className="h-5 w-5 text-primary-600" />
                  Oximetria Completa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Métricas principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                    {exame.spo2_min !== null && exame.spo2_min !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SpO2 Mínima</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.spo2_min).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.spo2_avg !== null && exame.spo2_avg !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SpO2 Média</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.spo2_avg).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.spo2_max !== null && exame.spo2_max !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SpO2 Máxima</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.spo2_max).toFixed(1)}%</p>
                      </div>
                    )}
                    {exame.tempo_spo2_90_seg && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tempo SpO2 &lt;90%</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.tempo_spo2_90_seg)}</p>
                      </div>
                    )}
                    {exame.num_dessaturacoes !== null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Dessaturações</p>
                        <p className="text-lg font-semibold text-gray-900">{exame.num_dessaturacoes}</p>
                      </div>
                    )}
                    {exame.ido !== null && exame.ido !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IDO</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.ido).toFixed(1)} /hora</p>
                      </div>
                    )}
                    {exame.ido_sono !== null && exame.ido_sono !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IDO Durante Sono</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.ido_sono).toFixed(1)} /hora</p>
                      </div>
                    )}
                    {exame.num_eventos_hipoxemia !== null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Eventos de Hipoxemia</p>
                        <p className="text-lg font-semibold text-gray-900">{exame.num_eventos_hipoxemia}</p>
                      </div>
                    )}
                    {exame.tempo_hipoxemia_seg !== null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tempo em Hipoxemia</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.tempo_hipoxemia_seg)}</p>
                      </div>
                    )}
                  </div>

                  {/* Histograma de SpO2 */}
                  {exame.spo2_histograma && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Distribuição de SpO2</p>
                      <HistogramChart
                        data={[
                          { label: '>95%', value: exame.spo2_histograma['>95'] || 0, color: 'bg-green-500' },
                          { label: '95-93%', value: exame.spo2_histograma['95-93'] || 0, color: 'bg-green-400' },
                          { label: '92-90%', value: exame.spo2_histograma['92-90'] || 0, color: 'bg-yellow-400' },
                          { label: '89-87%', value: exame.spo2_histograma['89-87'] || 0, color: 'bg-orange-400' },
                          { label: '86-84%', value: exame.spo2_histograma['86-84'] || 0, color: 'bg-orange-500' },
                          { label: '83-81%', value: exame.spo2_histograma['83-81'] || 0, color: 'bg-red-400' },
                          { label: '80-78%', value: exame.spo2_histograma['80-78'] || 0, color: 'bg-red-500' },
                          { label: '<78%', value: exame.spo2_histograma['<78'] || 0, color: 'bg-red-600' },
                        ]}
                        maxValue={100}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 7: Carga Hipóxica (apenas para Polissonografia) */}
          {exame.tipo === 1 && exame.carga_hipoxica !== null && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <AlertCircle className="h-5 w-5 text-primary-600" />
                  Carga Hipóxica
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Risco Cardiovascular</p>
                    <RiskBar value={exame.carga_hipoxica} max={300} />
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Carga hipóxica: {exame.carga_hipoxica.toFixed(2)} %.min/hora</p>
                    <p className="mt-1">Valores acima de 200 indicam risco cardiovascular elevado.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 8: Frequência Cardíaca (apenas para Polissonografia) */}
          {exame.tipo === 1 && (exame.bpm_min !== null || exame.bpm_medio !== null || exame.bpm_max !== null) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Heart className="h-5 w-5 text-primary-600" />
                  Frequência Cardíaca
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 items-start">
                    {exame.bpm_min !== null && exame.bpm_min !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">FC Mínima</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.bpm_min)} bpm</p>
                      </div>
                    )}
                    {exame.bpm_medio !== null && exame.bpm_medio !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">FC Média</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.bpm_medio)} bpm</p>
                      </div>
                    )}
                    {exame.bpm_max !== null && exame.bpm_max !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">FC Máxima</p>
                        <p className="text-lg font-semibold text-gray-900">{Number(exame.bpm_max)} bpm</p>
                      </div>
                    )}
                  </div>
                  {/* Histograma de FC */}
                  {exame.bpm_histograma && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Distribuição de Frequência Cardíaca</p>
                      <HistogramChart
                        data={Object.entries(exame.bpm_histograma).map(([label, value]: [string, any]) => ({
                          label,
                          value: Number(value) || 0,
                          color: 'bg-blue-500',
                        }))}
                        maxValue={100}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 9: Sono Estimado (apenas para Polissonografia) */}
          {exame.tipo === 1 && (exame.tempo_sono_seg !== null || exame.eficiencia_sono_pct !== null) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5 text-primary-600" />
                  Sono Estimado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                  {exame.tempo_sono_seg !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempo Total de Sono</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.tempo_sono_seg)}</p>
                    </div>
                  )}
                  {exame.tempo_dormir_seg !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempo para Dormir</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.tempo_dormir_seg)}</p>
                    </div>
                  )}
                  {exame.tempo_acordado_seg !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempo Acordado Pós-Sono</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDuration(exame.tempo_acordado_seg)}</p>
                    </div>
                  )}
                  {exame.eficiencia_sono_pct !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Eficiência do Sono</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Number(exame.eficiencia_sono_pct).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 11: Cardiologia (apenas para Polissonografia) */}
          {exame.tipo === 1 && exame.fibrilacao_atrial !== null && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Heart className="h-5 w-5 text-primary-600" />
                  Cardiologia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Fibrilação Atrial</p>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border ${getFibrilacaoColor(
                        exame.fibrilacao_atrial
                      )}`}
                    >
                      {getFibrilacaoLabel(exame.fibrilacao_atrial)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>0 = Negativa | 1 = Positiva | &lt;0 = Inconclusivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Footer dentro do conteúdo scrollável */}
          <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-6">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                {canDownloadPDF && exame.biologix_exam_key && exame.biologix_exam_key.trim() ? (
                  <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleBaixarPDF}>
                    Baixar PDF
                  </Button>
                ) : canDownloadPDF && (
                  <p className="text-sm text-gray-500 italic">PDF não disponível para este exame</p>
                )}
                {canEditExame && hasChanges() && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </>
                )}
              </div>
              <Button variant="primary" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

