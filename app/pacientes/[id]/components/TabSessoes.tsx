'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Filter, Plus, Edit, Trash2, Tag as TagIcon, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { DateInput } from '@/components/ui/DateInput'
import { Label } from '@/components/ui/Label'
import { showSuccess, showError } from '@/components/ui/Toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import ModalNovaSessao from '../../components/ModalNovaSessao'
import ModalEditarSessao from '../../components/ModalEditarSessao'

interface Sessao {
  id: string
  data_sessao: string
  protocolo: string[] | null
  contador_pulsos_inicial: number
  contador_pulsos_final: number
  observacoes: string | null
  editado_em: string | null
  editado_por: string | null
  user_id: string
  users: {
    nome: string
  } | null
}

interface TabSessoesProps {
  pacienteId: string
  onSessionUpdate?: () => void
}

export default function TabSessoes({ pacienteId, onSessionUpdate }: TabSessoesProps) {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showNovaSessaoModal, setShowNovaSessaoModal] = useState(false)
  const [showEditarSessaoModal, setShowEditarSessaoModal] = useState(false)
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [sessaoToDelete, setSessaoToDelete] = useState<string | null>(null)
  
  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', user.email)
          .single()
        if (userData) {
          setUserRole(userData.role)
          setUserId(userData.id)
        }
      }
    }
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchSessoes()
  }, [pacienteId, filtroDataInicio, filtroDataFim])

  const fetchSessoes = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Buscar sessões SEM join com users para evitar erro PGRST201 (múltiplas relações)
      // Fazemos a busca de usuários separadamente depois
      // IMPORTANTE: Não usar select('*') pois pode tentar fazer joins automáticos
      let query = supabase
        .from('sessoes')
        .select('id, paciente_id, user_id, data_sessao, protocolo, contador_pulsos_inicial, contador_pulsos_final, observacoes, created_at, updated_at, editado_por, editado_em')
        .eq('paciente_id', pacienteId)
        .order('data_sessao', { ascending: false })

      // Aplicar filtro de data apenas se fornecido
      if (filtroDataInicio) {
        query = query.gte('data_sessao', filtroDataInicio)
      }
      if (filtroDataFim) {
        query = query.lte('data_sessao', filtroDataFim)
      }

      const { data: sessoesData, error } = await query

      if (error) {
        console.error('Erro ao buscar sessões:', error)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        
        // Mensagem de erro mais específica
        let errorMessage = 'Erro ao carregar sessões. '
        if (error.code === '42501') {
          errorMessage += 'Você não tem permissão para visualizar sessões. Verifique seu perfil de usuário.'
        } else if (error.code === 'PGRST116') {
          // Nenhuma sessão encontrada
          setSessoes([])
          return
        } else if (error.code === 'PGRST201') {
          // Erro de múltiplas relações - não deveria acontecer com a query atual
          console.error('Erro PGRST201: Múltiplas relações encontradas. Tentando novamente sem join...')
          // Tentar novamente sem join (já estamos fazendo isso, mas vamos garantir)
          errorMessage += 'Erro ao carregar dados. Tente recarregar a página.'
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += 'Tente recarregar a página ou entre em contato com o suporte.'
        }
        
        showError(errorMessage)
        return
      }

      if (!sessoesData || sessoesData.length === 0) {
        setSessoes([])
        return
      }

      // Buscar nomes dos usuários separadamente para evitar problemas de RLS
      const userIds = [...new Set(sessoesData.map(s => s.user_id).filter(Boolean))]
      const usersMap: Record<string, { nome: string }> = {}

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, nome')
          .in('id', userIds)

        if (!usersError && usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = { nome: user.nome }
          })
        }
      }

      // Combinar dados das sessões com os nomes dos usuários
      const sessoesComUsuarios = sessoesData.map(sessao => ({
        ...sessao,
        users: usersMap[sessao.user_id] || null
      }))

      setSessoes(sessoesComUsuarios)
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao carregar sessões')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    // Fix timezone issue: parse date as local date, not UTC
    // dateString is in format "YYYY-MM-DD" from PostgreSQL DATE type
    // We need to create a local date to avoid timezone conversion
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed in JavaScript
    return date.toLocaleDateString('pt-BR')
  }

  const handleDeleteClick = (sessaoId: string) => {
    setSessaoToDelete(sessaoId)
    setShowDeleteConfirmModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sessaoToDelete) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('sessoes')
        .delete()
        .eq('id', sessaoToDelete)

      if (error) {
        console.error('Erro ao deletar sessão:', error)
        showError('Erro ao deletar sessão. Verifique se você tem permissão para esta ação.')
        setShowDeleteConfirmModal(false)
        setSessaoToDelete(null)
        return
      }

      showSuccess('Sessão deletada com sucesso!')
      setShowDeleteConfirmModal(false)
      setSessaoToDelete(null)
      fetchSessoes()
      onSessionUpdate?.()
    } catch (error) {
      console.error('Erro inesperado:', error)
      showError('Erro inesperado ao deletar sessão')
      setShowDeleteConfirmModal(false)
      setSessaoToDelete(null)
    }
  }

  const handleEdit = (sessao: Sessao) => {
    setSelectedSessao(sessao)
    setShowEditarSessaoModal(true)
  }

  const canEdit = (sessao: Sessao) => {
    if (!userRole) return false
    return userRole === 'admin' || userRole === 'equipe'
  }

  const canDelete = (sessao: Sessao) => {
    if (!userRole) return false
    return userRole === 'admin' || userRole === 'equipe'
  }
  const canCreate = userRole === 'admin' || userRole === 'equipe'

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Sessões</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{sessoes.length} sessão(ões)</span>
              </div>
            </div>
            {canCreate && (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowNovaSessaoModal(true)}
              >
                Nova Sessão
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium text-gray-700">Filtros</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {(filtroDataInicio || filtroDataFim) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroDataInicio('')
                    setFiltroDataFim('')
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">Carregando sessões...</p>
            </div>
          ) : sessoes.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma sessão encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {canCreate
                  ? 'Este paciente ainda não possui sessões registradas ou os filtros não retornaram resultados.'
                  : 'Este paciente ainda não possui sessões registradas.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Pulsos</TableHead>
                    <TableHead>Dentista</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessoes.map((sessao) => {
                    const pulsosUtilizados = sessao.contador_pulsos_final - sessao.contador_pulsos_inicial
                    const isEdited = sessao.editado_em !== null

                    return (
                      <TableRow key={sessao.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(sessao.data_sessao)}
                            </p>
                            {isEdited && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 border border-warning-200">
                                Editada
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sessao.protocolo && sessao.protocolo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {sessao.protocolo.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  <TagIcon className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">
                            {sessao.contador_pulsos_inicial} → {sessao.contador_pulsos_final}
                          </p>
                          <p className="text-xs text-gray-500">({pulsosUtilizados} pulsos utilizados)</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-gray-900">
                            {sessao.users?.nome || 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit(sessao) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(sessao)}
                                title="Editar Sessão"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete(sessao) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(sessao.id)}
                                title="Deletar Sessão"
                                className="text-danger-600 hover:text-danger-800 hover:bg-danger-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Sessão */}
      <ModalNovaSessao
        isOpen={showNovaSessaoModal}
        onClose={() => setShowNovaSessaoModal(false)}
        pacienteId={pacienteId}
        onSuccess={() => {
          fetchSessoes()
          setShowNovaSessaoModal(false)
          onSessionUpdate?.()
        }}
      />

      {/* Modal Editar Sessão */}
      {selectedSessao && (
        <ModalEditarSessao
          isOpen={showEditarSessaoModal}
          onClose={() => {
            setShowEditarSessaoModal(false)
            setSelectedSessao(null)
          }}
          sessao={selectedSessao}
          onSuccess={() => {
            fetchSessoes()
            setShowEditarSessaoModal(false)
            setSelectedSessao(null)
            onSessionUpdate?.()
          }}
        />
      )}

      {/* Modal de Confirmação de Deleção */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-danger-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Confirmar Exclusão
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-600 pt-2">
              Tem certeza que deseja deletar esta sessão? Esta ação não pode ser desfeita e a sessão será permanentemente removida do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmModal(false)
                setSessaoToDelete(null)
              }}
              className="flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              className="bg-danger-600 hover:bg-danger-700 text-white flex-1 sm:flex-initial"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

