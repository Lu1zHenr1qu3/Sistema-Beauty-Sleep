'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Minus, Calendar, AlertTriangle, CheckCircle, Pencil } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface ResumoTratamentoProps {
  paciente: {
    id: string
    status: string
    sessoes_compradas: number
    sessoes_adicionadas: number
    sessoes_utilizadas: number
    proxima_manutencao: string | null
  }
  onPacienteUpdate?: () => void
}

export default function ResumoTratamento({
  paciente,
  onPacienteUpdate,
}: ResumoTratamentoProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showAddSessoesModal, setShowAddSessoesModal] = useState(false)
  const [showRemoveSessoesModal, setShowRemoveSessoesModal] = useState(false)
  const [showEditCompradasModal, setShowEditCompradasModal] = useState(false)
  const [sessoesToAdd, setSessoesToAdd] = useState('')
  const [sessoesToRemove, setSessoesToRemove] = useState('')
  const [sessoesCompradasToEdit, setSessoesCompradasToEdit] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isEditingCompradas, setIsEditingCompradas] = useState(false)

  // Efeito para recálculo quando paciente muda
  useEffect(() => {
    // Recalcula valores quando paciente é atualizado
  }, [paciente])

  // Buscar role do usuário
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single()

        if (userData) {
          setUserRole(userData.role)
        }
      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error)
      }
    }

    fetchUserRole()
  }, [])

  const sessoesDisponiveis = Math.max(
    0,
    (paciente.sessoes_compradas || 0) +
    (paciente.sessoes_adicionadas || 0) -
    (paciente.sessoes_utilizadas || 0)
  )

  const totalSessoes = (paciente.sessoes_compradas || 0) + (paciente.sessoes_adicionadas || 0)
  // Se não há sessões compradas/adicionadas mas há sessões utilizadas, usar o número de utilizadas como base
  const baseParaAdesao = totalSessoes > 0 ? totalSessoes : Math.max(1, paciente.sessoes_utilizadas || 0)
  const adesao = baseParaAdesao > 0 ? ((paciente.sessoes_utilizadas || 0) / baseParaAdesao) * 100 : 0

  const getAdesaoBadgeColor = () => {
    if (adesao >= 80) return 'bg-success-100 text-success-800'
    if (adesao >= 50) return 'bg-warning-100 text-warning-800'
    return 'bg-danger-100 text-danger-800'
  }

  const getAdesaoText = () => {
    if (adesao >= 80) return 'Excelente'
    if (adesao >= 50) return 'Boa'
    return 'Baixa'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    // Fix timezone issue: if date is in "YYYY-MM-DD" format (DATE type), parse as local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // DATE type - parse as local date to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString('pt-BR')
    } else {
      // TIMESTAMP type - use normal parsing
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    }
  }

  const isManutencaoAtrasada = () => {
    if (!paciente.proxima_manutencao) return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const manutencao = new Date(paciente.proxima_manutencao)
    manutencao.setHours(0, 0, 0, 0)
    return manutencao < hoje
  }

  const canAddSessoes = userRole === 'admin' || userRole === 'equipe'

  const handleAddSessoes = async () => {
    const quantidade = parseInt(sessoesToAdd)
    if (!quantidade || quantidade <= 0) {
      showError('Por favor, informe uma quantidade válida maior que zero')
      return
    }

    setIsAdding(true)

    try {
      const supabase = createClient()

      const novoValor = (paciente.sessoes_adicionadas || 0) + quantidade

      const { error, data } = await supabase
        .from('pacientes')
        .update({
          sessoes_adicionadas: novoValor,
        })
        .eq('id', paciente.id)
        .select()

      if (error) {
        console.error('Erro ao adicionar sessões:', error)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        
        let errorMessage = 'Erro ao adicionar sessões. '
        if (error.code === '42501') {
          errorMessage += 'Você não tem permissão para adicionar sessões. Verifique seu perfil de usuário.'
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += 'Tente novamente ou entre em contato com o suporte.'
        }
        
        showError(errorMessage)
        setIsAdding(false)
        return
      }

      showSuccess(`${quantidade} sessão(ões) adicionada(s) com sucesso!`)
      setShowAddSessoesModal(false)
      setSessoesToAdd('')
      
      // Chamar callback imediatamente para atualizar os dados
      onPacienteUpdate?.()
    } catch (error) {
      console.error('Erro inesperado ao adicionar sessões:', error)
      showError('Erro inesperado ao adicionar sessões')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveSessoes = async () => {
    const quantidade = parseInt(sessoesToRemove)
    if (!quantidade || quantidade <= 0) {
      showError('Por favor, informe uma quantidade válida maior que zero')
      return
    }

    const sessoesAtuais = paciente.sessoes_adicionadas || 0
    if (quantidade > sessoesAtuais) {
      showError(`Você não pode remover mais sessões do que foram adicionadas. Sessões adicionadas atuais: ${sessoesAtuais}`)
      return
    }

    setIsRemoving(true)

    try {
      const supabase = createClient()

      const novoValor = Math.max(0, sessoesAtuais - quantidade)

      const { error, data } = await supabase
        .from('pacientes')
        .update({
          sessoes_adicionadas: novoValor,
        })
        .eq('id', paciente.id)
        .select()

      if (error) {
        console.error('Erro ao remover sessões:', error)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        
        let errorMessage = 'Erro ao remover sessões. '
        if (error.code === '42501') {
          errorMessage += 'Você não tem permissão para remover sessões. Verifique seu perfil de usuário.'
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += 'Tente novamente ou entre em contato com o suporte.'
        }
        
        showError(errorMessage)
        setIsRemoving(false)
        return
      }

      showSuccess(`${quantidade} sessão(ões) removida(s) com sucesso!`)
      setShowRemoveSessoesModal(false)
      setSessoesToRemove('')
      
      // Chamar callback imediatamente para atualizar os dados
      onPacienteUpdate?.()
    } catch (error) {
      console.error('Erro inesperado ao remover sessões:', error)
      showError('Erro inesperado ao remover sessões')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleEditSessoesCompradas = async () => {
    const quantidade = parseInt(sessoesCompradasToEdit)
    if (isNaN(quantidade) || quantidade < 0) {
      showError('Por favor, informe uma quantidade válida (0 ou maior)')
      return
    }

    setIsEditingCompradas(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('pacientes')
        .update({
          sessoes_compradas: quantidade,
        })
        .eq('id', paciente.id)
        .select()

      if (error) {
        console.error('Erro ao editar sessões compradas:', error)
        console.error('Erro completo:', JSON.stringify(error, null, 2))

        let errorMessage = 'Erro ao editar sessões compradas. '
        if (error.code === '42501') {
          errorMessage += 'Você não tem permissão para editar sessões compradas. Verifique seu perfil de usuário.'
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += 'Tente novamente ou entre em contato com o suporte.'
        }

        showError(errorMessage)
        setIsEditingCompradas(false)
        return
      }

      showSuccess('Sessões compradas atualizadas com sucesso!')
      setShowEditCompradasModal(false)
      setSessoesCompradasToEdit('')
      onPacienteUpdate?.()
    } catch (error) {
      console.error('Erro inesperado ao editar sessões compradas:', error)
      showError('Erro inesperado ao editar sessões compradas')
    } finally {
      setIsEditingCompradas(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resumo de Tratamento</CardTitle>
            {canAddSessoes && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSessoesCompradasToEdit(String(paciente.sessoes_compradas || 0))
                    setShowEditCompradasModal(true)
                  }}
                  leftIcon={<Pencil className="h-4 w-4" />}
                >
                  Editar Compradas
                </Button>
                {(paciente.sessoes_adicionadas || 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveSessoesModal(true)}
                    leftIcon={<Minus className="h-4 w-4" />}
                  >
                    Remover Sessões
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddSessoesModal(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Adicionar Sessões
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Métricas de Sessões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Sessões Compradas</p>
              <p className="text-2xl font-bold text-gray-900">
                {paciente.sessoes_compradas || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Sessões Adicionadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {paciente.sessoes_adicionadas || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Sessões Utilizadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {paciente.sessoes_utilizadas || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Sessões Disponíveis</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{sessoesDisponiveis}</p>
                {sessoesDisponiveis < 2 && sessoesDisponiveis >= 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    <AlertTriangle className="h-3 w-3" />
                    Poucas sessões disponíveis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Adesão */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">Adesão ao Tratamento</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAdesaoBadgeColor()}`}
              >
                {adesao.toFixed(0)}% - {getAdesaoText()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    adesao >= 80
                      ? 'bg-success-500'
                      : adesao >= 50
                        ? 'bg-warning-500'
                        : 'bg-danger-500'
                  }`}
                  style={{ width: `${Math.min(adesao, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {paciente.sessoes_utilizadas || 0} de {totalSessoes > 0 ? totalSessoes : (paciente.sessoes_utilizadas || 0)} sessões utilizadas
            </p>
          </div>

          {/* Próxima Manutenção */}
          {paciente.status === 'finalizado' && paciente.proxima_manutencao && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Próxima Manutenção</p>
                    <p className="text-sm text-gray-600">{formatDate(paciente.proxima_manutencao)}</p>
                  </div>
                </div>
                {isManutencaoAtrasada() && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-danger-100 text-danger-800">
                    <AlertTriangle className="h-4 w-4" />
                    Manutenção atrasada
                  </span>
                )}
                {!isManutencaoAtrasada() && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800">
                    <CheckCircle className="h-4 w-4" />
                    Em dia
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Adicionar Sessões */}
      <Dialog open={showAddSessoesModal} onOpenChange={setShowAddSessoesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Sessões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Quantas sessões deseja adicionar ao paciente?
            </p>
            <div className="space-y-2">
              <Label htmlFor="sessoes">
                Quantidade <span className="text-danger-600">*</span>
              </Label>
              <Input
                id="sessoes"
                type="number"
                min="1"
                value={sessoesToAdd}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^\d+$/.test(value)) {
                    setSessoesToAdd(value)
                  }
                }}
                placeholder="Ex: 5"
                disabled={isAdding}
              />
              <p className="text-xs text-gray-500">
                Sessões atuais adicionadas: {paciente.sessoes_adicionadas || 0}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSessoesModal(false)
                setSessoesToAdd('')
              }}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddSessoes}
              isLoading={isAdding}
              disabled={isAdding || !sessoesToAdd || parseInt(sessoesToAdd) <= 0}
            >
              Adicionar Sessões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Sessões Compradas */}
      <Dialog open={showEditCompradasModal} onOpenChange={setShowEditCompradasModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Sessões Compradas</DialogTitle>
            <DialogDescription>
              Defina a quantidade total de sessões compradas para este paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sessoes_compradas_editar">
                Quantidade <span className="text-danger-600">*</span>
              </Label>
              <Input
                id="sessoes_compradas_editar"
                type="number"
                min="0"
                value={sessoesCompradasToEdit}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^\d+$/.test(value)) {
                    setSessoesCompradasToEdit(value)
                  }
                }}
                placeholder="Ex: 12"
                disabled={isEditingCompradas}
              />
              <p className="text-xs text-gray-500">
                Valor atual: {paciente.sessoes_compradas || 0}
              </p>
            </div>
          </div>
          <div className="flex flex-row justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditCompradasModal(false)
                setSessoesCompradasToEdit('')
              }}
              disabled={isEditingCompradas}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSessoesCompradas}
              isLoading={isEditingCompradas}
              disabled={
                isEditingCompradas ||
                sessoesCompradasToEdit.trim() === '' ||
                isNaN(parseInt(sessoesCompradasToEdit)) ||
                parseInt(sessoesCompradasToEdit) < 0
              }
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Remover Sessões */}
      <Dialog open={showRemoveSessoesModal} onOpenChange={setShowRemoveSessoesModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remover Sessões</DialogTitle>
            <DialogDescription>
              Quantas sessões adicionadas deseja remover do paciente?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sessoes_remover">
                Quantidade <span className="text-danger-600">*</span>
              </Label>
              <Input
                id="sessoes_remover"
                type="number"
                min="1"
                max={paciente.sessoes_adicionadas || 0}
                value={sessoesToRemove}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^\d+$/.test(value)) {
                    setSessoesToRemove(value)
                  }
                }}
                placeholder="Ex: 2"
                disabled={isRemoving}
              />
              <p className="text-xs text-gray-500">
                Sessões adicionadas atuais: {paciente.sessoes_adicionadas || 0}
              </p>
              {(paciente.sessoes_adicionadas || 0) === 0 && (
                <p className="text-xs text-danger-600">
                  Não há sessões adicionadas para remover.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-row justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveSessoesModal(false)
                setSessoesToRemove('')
              }}
              disabled={isRemoving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSessoes}
              isLoading={isRemoving}
              disabled={
                isRemoving || 
                !sessoesToRemove || 
                sessoesToRemove.trim() === '' ||
                isNaN(parseInt(sessoesToRemove)) ||
                parseInt(sessoesToRemove) <= 0 || 
                parseInt(sessoesToRemove) > (paciente.sessoes_adicionadas || 0) ||
                (paciente.sessoes_adicionadas || 0) === 0
              }
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md"
            >
              {isRemoving ? 'Removendo...' : 'Confirmar Remoção'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

