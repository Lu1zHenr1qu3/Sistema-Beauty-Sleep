'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Tag as TagIcon, AlertTriangle, History } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateInput } from '@/components/ui/DateInput'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import ModalHistoricoSessao from './ModalHistoricoSessao'

interface Tag {
  id: string
  nome: string
  cor: string
}

interface Sessao {
  id: string
  data_sessao: string
  protocolo: string[] | null
  contador_pulsos_inicial: number
  contador_pulsos_final: number
  observacoes: string | null
  user_id: string
}

interface ModalEditarSessaoProps {
  isOpen: boolean
  onClose: () => void
  sessao: Sessao
  onSuccess?: () => void
}

export default function ModalEditarSessao({ isOpen, onClose, sessao, onSuccess }: ModalEditarSessaoProps) {
  const [dataSessao, setDataSessao] = useState(sessao.data_sessao)
  const [protocoloIds, setProtocoloIds] = useState<string[]>([])
  const [contadorInicial, setContadorInicial] = useState<number | ''>(sessao.contador_pulsos_inicial)
  const [contadorFinal, setContadorFinal] = useState<number | ''>(sessao.contador_pulsos_final)
  const [observacoes, setObservacoes] = useState(sessao.observacoes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sessaoCreatorName, setSessaoCreatorName] = useState<string | null>(null)
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)

  useEffect(() => {
    const fetchTagsAndUser = async () => {
      const supabase = createClient()
      
      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, nome, cor')
        .order('nome')

      if (tagsError) {
        console.error('Erro ao buscar tags:', tagsError)
        showError('Erro ao carregar tags para protocolos.')
      } else {
        setAvailableTags(tagsData || [])
      }

      // Fetch user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', user.email)
          .single()
        const currentUserId = userData?.id || null
        setUserId(currentUserId)
        setUserRole(userData?.role || null)

        // Fetch sessão creator name if different from current user
        if (sessao.user_id && sessao.user_id !== currentUserId) {
          const { data: creatorData } = await supabase
            .from('users')
            .select('nome')
            .eq('id', sessao.user_id)
            .single()
          if (creatorData) {
            setSessaoCreatorName(creatorData.nome)
          } else {
            setSessaoCreatorName(null)
          }
        } else {
          setSessaoCreatorName(null)
        }
      }

      // Map protocolo names to tag IDs
      if (sessao.protocolo && sessao.protocolo.length > 0) {
        const tagIds: string[] = []
        for (const protocoloName of sessao.protocolo) {
          const tag = tagsData?.find((t) => t.nome === protocoloName)
          if (tag) {
            tagIds.push(tag.id)
          }
        }
        setProtocoloIds(tagIds)
      }
    }
    
    if (isOpen) {
      fetchTagsAndUser()
      // Reset form with sessao data
      setDataSessao(sessao.data_sessao)
      setContadorInicial(sessao.contador_pulsos_inicial)
      setContadorFinal(sessao.contador_pulsos_final)
      setObservacoes(sessao.observacoes || '')
      setErrors({})
    }
  }, [isOpen, sessao])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!dataSessao || !dataSessao.trim()) {
      newErrors.dataSessao = 'Data da sessão é obrigatória.'
    }
    if (contadorInicial === '') {
      newErrors.contadorInicial = 'Contador inicial é obrigatório.'
    } else if (typeof contadorInicial === 'number' && contadorInicial < 0) {
      newErrors.contadorInicial = 'Contador inicial não pode ser negativo.'
    }
    if (contadorFinal === '') {
      newErrors.contadorFinal = 'Contador final é obrigatório.'
    } else if (typeof contadorFinal === 'number' && contadorFinal < 0) {
      newErrors.contadorFinal = 'Contador final não pode ser negativo.'
    } else if (typeof contadorInicial === 'number' && typeof contadorFinal === 'number' && contadorFinal < contadorInicial) {
      newErrors.contadorFinal = 'Contador final não pode ser menor que o inicial.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    if (!userId) {
      showError('Erro: Usuário não autenticado ou ID não encontrado.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // Get tag names from IDs
      const protocoloNames = protocoloIds.map((tagId) => {
        const tag = availableTags.find((t) => t.id === tagId)
        return tag?.nome || ''
      }).filter(Boolean)

      // Preparar dados para update - manter user_id original
      // Fix timezone issue: ensure date is sent as "YYYY-MM-DD" string without timezone conversion
      const dataSessaoString = dataSessao.trim()
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataSessaoString)) {
        setErrors({ ...errors, dataSessao: 'Formato de data inválido' })
        setIsSubmitting(false)
        return
      }
      
      const updateData: any = {
        data_sessao: dataSessaoString, // Send as string "YYYY-MM-DD" - PostgreSQL DATE type doesn't have timezone
        protocolo: protocoloNames.length > 0 ? protocoloNames : null,
        contador_pulsos_inicial: contadorInicial as number,
        contador_pulsos_final: contadorFinal as number,
        observacoes: observacoes.trim() || null,
        editado_por: userId,
        editado_em: new Date().toISOString(),
      }
      
      // IMPORTANTE: Não alterar user_id - manter o original
      // A política RLS verifica se user_id = get_user_id(), então não podemos alterá-lo

      const { error } = await supabase
        .from('sessoes')
        .update(updateData)
        .eq('id', sessao.id)

      if (error) {
        console.error('Erro ao editar sessão:', error)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        console.error('Dados enviados:', updateData)
        console.error('Sessão original:', sessao)
        console.error('User ID:', userId)
        console.error('User Role:', userRole)
        
        let errorMessage = 'Erro ao editar sessão. '
        if (error.code === '42501') {
          errorMessage += 'Você não tem permissão para editar esta sessão. Verifique seu perfil de usuário.'
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += 'Tente novamente ou entre em contato com o suporte.'
        }
        
        showError(errorMessage)
        return
      }

      showSuccess('Sessão editada com sucesso!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao editar sessão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pulsosUtilizados =
    typeof contadorInicial === 'number' && typeof contadorFinal === 'number' && contadorFinal >= contadorInicial
      ? contadorFinal - contadorInicial
      : 0

  const handleTagToggle = (tagId: string) => {
    setProtocoloIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Editar Sessão</DialogTitle>
                  <DialogDescription>
                    Atualize os dados da sessão do paciente.
                  </DialogDescription>
                </DialogHeader>
        
        {/* Warning if Admin is editing another user's sessão */}
        {userRole === 'admin' && sessao.user_id !== userId && sessaoCreatorName && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning-900">
                Você está editando uma sessão criada por outro usuário
              </p>
              <p className="text-xs text-warning-700 mt-1">
                Criador original: <strong>{sessaoCreatorName}</strong>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data da Sessão */}
          <div>
            <Label htmlFor="dataSessao">
              Data da Sessão <span className="text-danger-600">*</span>
            </Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
              <DateInput
                id="dataSessao"
                value={dataSessao}
                onChange={(value) => {
                  setDataSessao(value)
                  setErrors((prev) => {
                    const { dataSessao: _, ...rest } = prev
                    return rest
                  })
                }}
                className={`pl-10 ${errors.dataSessao ? 'border-danger-500' : ''}`}
                displayFormat="DD/MM/YYYY"
                placeholder="DD/MM/AAAA"
                required
                disabled={isSubmitting}
              />
            </div>
            {errors.dataSessao && <p className="mt-1 text-sm text-danger-600">{errors.dataSessao}</p>}
          </div>

          {/* Protocolo (Tags) */}
          <div>
            <Label>Protocolo (Tags)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={protocoloIds.includes(tag.id) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleTagToggle(tag.id)}
                  disabled={isSubmitting}
                  style={
                    protocoloIds.includes(tag.id)
                      ? { backgroundColor: tag.cor, borderColor: tag.cor, color: 'white' }
                      : { borderColor: tag.cor, color: tag.cor }
                  }
                  className={protocoloIds.includes(tag.id) ? 'hover:opacity-80' : 'hover:bg-gray-50'}
                >
                  <TagIcon className="h-4 w-4 mr-2" />
                  {tag.nome}
                </Button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Selecione as tags de protocolo aplicadas nesta sessão.</p>
          </div>

          {/* Contadores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contadorInicial">
                Contador Inicial <span className="text-danger-600">*</span>
              </Label>
              <Input
                id="contadorInicial"
                type="number"
                value={contadorInicial}
                onChange={(e) => {
                  setContadorInicial(parseInt(e.target.value) || '')
                  setErrors((prev) => {
                    const { contadorInicial: _, ...rest } = prev
                    return rest
                  })
                }}
                placeholder="0"
                className={errors.contadorInicial ? 'border-danger-500' : ''}
                disabled={isSubmitting}
              />
              {errors.contadorInicial && <p className="mt-1 text-sm text-danger-600">{errors.contadorInicial}</p>}
            </div>
            <div>
              <Label htmlFor="contadorFinal">
                Contador Final <span className="text-danger-600">*</span>
              </Label>
              <Input
                id="contadorFinal"
                type="number"
                value={contadorFinal}
                onChange={(e) => {
                  setContadorFinal(parseInt(e.target.value) || '')
                  setErrors((prev) => {
                    const { contadorFinal: _, ...rest } = prev
                    return rest
                  })
                }}
                placeholder="0"
                className={errors.contadorFinal ? 'border-danger-500' : ''}
                disabled={isSubmitting}
              />
              {errors.contadorFinal && <p className="mt-1 text-sm text-danger-600">{errors.contadorFinal}</p>}
            </div>
          </div>

          {/* Pulsos Utilizados */}
          <div>
            <Label>Pulsos Utilizados</Label>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pulsosUtilizados}</p>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a sessão..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="flex flex-row justify-between items-center">
            <div>
              {userRole === 'admin' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistoricoModal(true)}
                  leftIcon={<History className="h-4 w-4" />}
                >
                  Ver Histórico de Edições
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Modal Histórico de Edições */}
      {userRole === 'admin' && (
        <ModalHistoricoSessao
          isOpen={showHistoricoModal}
          onClose={() => setShowHistoricoModal(false)}
          sessaoId={sessao.id}
        />
      )}
    </Dialog>
  )
}

