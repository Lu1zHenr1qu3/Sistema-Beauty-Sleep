'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Filter } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { Button } from '@/components/ui/Button'

interface TempoMedioTratamentoProps {
  userRole: string | null
}

interface SegmentoData {
  categoria: string
  tempoMedio: number
  quantidade: number
  color: string
}

export default function TempoMedioTratamento({ userRole }: TempoMedioTratamentoProps) {
  const [segmentos, setSegmentos] = useState<SegmentoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'all' | '30' | '60' | '90' | '180' | '365'>('all')
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Set<string>>(new Set(['Normal', 'Leve', 'Moderado', 'Acentuado']))

  useEffect(() => {
    const fetchTempoMedio = async () => {
      try {
        const supabase = createClient()

        // Calcular data limite baseada no filtro
        let dataLimite: Date | null = null
        if (dateRange !== 'all') {
          dataLimite = new Date()
          dataLimite.setDate(dataLimite.getDate() - parseInt(dateRange))
        }

        // Buscar pacientes finalizados com seus exames
        let query = supabase
          .from('pacientes')
          .select('id, status, updated_at')
          .eq('status', 'finalizado')

        // Se há filtro de data, buscar apenas pacientes finalizados no período
        if (dataLimite) {
          query = query.gte('updated_at', dataLimite.toISOString())
        }

        const { data: pacientesFinalizados } = await query

        if (!pacientesFinalizados || pacientesFinalizados.length === 0) {
          setIsLoading(false)
          return
        }

        const pacientesIds = pacientesFinalizados.map((p) => p.id)

        // Buscar primeiro e último exame de cada paciente finalizado
        const pacientesComExames = await Promise.all(
          pacientesIds.map(async (pacienteId) => {
            const { data: exames } = await supabase
              .from('exames')
              .select('id, data_exame, ido_categoria')
              .eq('paciente_id', pacienteId)
              .order('data_exame', { ascending: true })

            if (!exames || exames.length === 0) return null

            const primeiroExame = exames[0]
            const ultimoExame = exames[exames.length - 1]

            // Buscar data de finalização (última sessão ou updated_at quando status mudou para finalizado)
            const { data: ultimaSessao } = await supabase
              .from('sessoes')
              .select('data_sessao')
              .eq('paciente_id', pacienteId)
              .order('data_sessao', { ascending: false })
              .limit(1)
              .single()

            const dataFinalizacao = ultimaSessao?.data_sessao || null

            if (!dataFinalizacao) return null

            const dataPrimeiroExame = new Date(primeiroExame.data_exame)
            const dataFinal = new Date(dataFinalizacao)
            const diffTime = Math.abs(dataFinal.getTime() - dataPrimeiroExame.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            return {
              idoInicial: primeiroExame.ido_categoria,
              tempoDias: diffDays,
            }
          })
        )

        // Filtrar nulls e agrupar por categoria IDO inicial
        const dadosValidos = pacientesComExames.filter((d): d is { idoInicial: number; tempoDias: number } => d !== null)

        const categorias: Record<number, { tempos: number[]; nome: string; color: string }> = {
          0: { tempos: [], nome: 'Normal', color: '#22c55e' }, // success-500
          1: { tempos: [], nome: 'Leve', color: '#f59e0b' }, // warning-500
          2: { tempos: [], nome: 'Moderado', color: '#f97316' }, // orange-500
          3: { tempos: [], nome: 'Acentuado', color: '#ef4444' }, // danger-500
        }

        dadosValidos.forEach((dado) => {
          const categoria = dado.idoInicial
          if (categoria !== null && categoria >= 0 && categoria <= 3) {
            categorias[categoria].tempos.push(dado.tempoDias)
          }
        })

        // Calcular tempo médio por segmento - sempre mostrar todas as categorias
        const segmentosData: SegmentoData[] = Object.entries(categorias)
          .map(([categoria, dados]) => {
            const categoriaNum = parseInt(categoria)
            
            // Se não há dados, retornar com valores zerados mas ainda incluir no gráfico
            if (dados.tempos.length === 0) {
              return {
                categoria: dados.nome,
                tempoMedio: 0,
                quantidade: 0,
                color: dados.color,
              }
            }

            const tempoMedio = dados.tempos.reduce((a, b) => a + b, 0) / dados.tempos.length

            return {
              categoria: dados.nome,
              tempoMedio: Math.round(tempoMedio),
              quantidade: dados.tempos.length,
              color: dados.color,
            }
          })

        setSegmentos(segmentosData)
      } catch (error) {
        console.error('Erro ao buscar tempo médio de tratamento:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTempoMedio()
  }, [dateRange])

  const isRecepcao = userRole === 'recepcao'

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-black" />
          <h3 className="text-lg font-semibold text-black">Tempo Médio de Tratamento</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Garantir que sempre temos todas as categorias, mesmo sem dados
  const todasCategorias: SegmentoData[] = [
    { categoria: 'Normal', tempoMedio: 0, quantidade: 0, color: '#22c55e' },
    { categoria: 'Leve', tempoMedio: 0, quantidade: 0, color: '#f59e0b' },
    { categoria: 'Moderado', tempoMedio: 0, quantidade: 0, color: '#f97316' },
    { categoria: 'Acentuado', tempoMedio: 0, quantidade: 0, color: '#ef4444' },
  ]

  // Mesclar dados existentes com todas as categorias
  const segmentosMerged = todasCategorias.map(cat => {
    const encontrado = segmentos.find(s => s.categoria === cat.categoria)
    return encontrado || cat
  })

  // Aplicar filtros: período e categoria
  let segmentosFiltrados = segmentosMerged.filter(s => categoriasFiltradas.has(s.categoria))

  // Se há filtro de período ativo, remover categorias com 0 pacientes
  if (dateRange !== 'all') {
    segmentosFiltrados = segmentosFiltrados.filter(s => s.quantidade > 0)
  }

  const segmentosCompletos = segmentosFiltrados

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-black">Tempo Médio de Tratamento</h3>
      </div>
      <p className="text-sm text-black mb-4">
        Tempo médio entre o primeiro exame e a finalização do tratamento, segmentado por categoria IDO inicial
      </p>

      {/* Filtros */}
      {!isRecepcao && (
        <div className="mb-6 pb-4 border-b border-gray-200 space-y-4">
          {/* Filtro de Período */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por período de finalização:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateRange === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('all')}
              >
                Todo o Período
              </Button>
              <Button
                variant={dateRange === '365' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('365')}
              >
                Últimos 12 Meses
              </Button>
              <Button
                variant={dateRange === '180' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('180')}
              >
                Últimos 6 Meses
              </Button>
              <Button
                variant={dateRange === '90' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('90')}
              >
                Últimos 90 Dias
              </Button>
              <Button
                variant={dateRange === '60' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('60')}
              >
                Últimos 60 Dias
              </Button>
              <Button
                variant={dateRange === '30' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange('30')}
              >
                Últimos 30 Dias
              </Button>
            </div>
          </div>

          {/* Filtro de Categoria */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por categoria:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {todasCategorias.map((cat) => (
                <Button
                  key={cat.categoria}
                  variant={categoriasFiltradas.has(cat.categoria) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const novasCategorias = new Set(categoriasFiltradas)
                    if (novasCategorias.has(cat.categoria)) {
                      novasCategorias.delete(cat.categoria)
                    } else {
                      novasCategorias.add(cat.categoria)
                    }
                    // Garantir que pelo menos uma categoria esteja selecionada
                    if (novasCategorias.size > 0) {
                      setCategoriasFiltradas(novasCategorias)
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.categoria}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isRecepcao ? (
        <p className="text-black text-center py-8">--</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={segmentosCompletos}
            barCategoryGap={segmentosCompletos.length === 1 ? '70%' : '20%'}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} dias`,
                `Pacientes: ${props.payload.quantidade}`,
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Bar 
              dataKey="tempoMedio" 
              name="Tempo Médio (dias)"
              barSize={segmentosCompletos.length === 1 ? 100 : undefined}
            >
              {segmentosCompletos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legenda com quantidade de pacientes - sempre mostrar todas as categorias */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {segmentosCompletos.map((segmento, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: segmento.color }}></div>
              <span className="text-sm font-medium text-black">{segmento.categoria}</span>
            </div>
            {isRecepcao ? (
              <p className="text-xs text-black">--</p>
            ) : segmento.quantidade === 0 ? (
              <>
                <p className="text-lg font-bold text-gray-400">0 dias</p>
                <p className="text-xs text-gray-400">0 pacientes</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-black">{segmento.tempoMedio} dias</p>
                <p className="text-xs text-black">{segmento.quantidade} pacientes</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

