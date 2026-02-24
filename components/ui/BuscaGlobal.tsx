'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import Link from 'next/link'

interface Paciente {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  status: string
}

export default function BuscaGlobal() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Paciente[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  // Buscar pacientes quando o termo de busca muda
  useEffect(() => {
    const searchPacientes = async () => {
      if (!debouncedSearch || debouncedSearch.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

        setIsLoading(true)
      try {
        const supabase = createClient()
        
        // Remove caracteres não numéricos para busca de CPF e telefone
        const numericSearch = debouncedSearch.replace(/\D/g, '')
        const searchTerm = debouncedSearch.trim()
        
        // Construir condições de busca usando PostgREST syntax
        const conditions: string[] = []
        
        // Busca por nome (case-insensitive) - PostgREST usa * para wildcard
        if (searchTerm.length >= 2) {
          conditions.push(`nome.ilike.*${searchTerm}*`)
        }
        
        // Busca por CPF ou telefone (se houver números)
        if (numericSearch.length >= 3) {
          conditions.push(`cpf.ilike.*${numericSearch}*`)
          conditions.push(`telefone.ilike.*${numericSearch}*`)
        }
        
        // Se não houver condições, não busca
        if (conditions.length === 0) {
          setResults([])
          setIsLoading(false)
          return
        }
        
        // Executar query com OR entre todas as condições
        // PostgREST syntax: campo.operador.valor separado por vírgula para OR
        const { data, error } = await supabase
          .from('pacientes')
          .select('id, nome, cpf, telefone, status')
          .or(conditions.join(','))
          .limit(10)

        if (error) {
          console.error('Erro ao buscar pacientes:', error)
          setResults([])
        } else {
          setResults(data || [])
          setIsOpen(data && data.length > 0)
        }
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchPacientes()
  }, [debouncedSearch])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Atalho de teclado Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // ESC para fechar dropdown
      if (event.key === 'Escape') {
        setIsOpen(false)
        searchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleResultClick = (pacienteId: string) => {
    setIsOpen(false)
    setSearchQuery('')
    router.push(`/pacientes/${pacienteId}`)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsOpen(false)
    setResults([])
    searchInputRef.current?.focus()
  }

  // Formatar CPF para exibição
  const formatCPF = (cpf: string | null) => {
    if (!cpf) return 'N/A'
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  // Formatar telefone para exibição
  const formatTelefone = (telefone: string | null) => {
    if (!telefone) return 'N/A'
    const cleaned = telefone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return telefone
  }

  // Highlight do termo buscado no nome
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.trim().length < 2) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar paciente (CPF, nome ou telefone)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
                  className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white text-sm sm:text-base" // Usando ring-primary do Design System
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar busca"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {/* Atalho de teclado hint */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden md:flex items-center gap-1 text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">K</kbd>
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((paciente) => (
                <button
                  key={paciente.id}
                  onClick={() => handleResultClick(paciente.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {highlightMatch(paciente.nome, searchQuery)}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 space-y-1">
                        {paciente.cpf && (
                          <div>CPF: {formatCPF(paciente.cpf)}</div>
                        )}
                        {paciente.telefone && (
                          <div>Tel: {formatTelefone(paciente.telefone)}</div>
                        )}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            paciente.status === 'ativo'
                              ? 'bg-green-100 text-green-800'
                              : paciente.status === 'lead'
                              ? 'bg-blue-100 text-blue-800'
                              : paciente.status === 'finalizado'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {paciente.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {isOpen && !isLoading && results.length === 0 && debouncedSearch.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 text-center text-gray-500">
            Nenhum paciente encontrado
          </div>
        </div>
      )}
    </div>
  )
}

