'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, AlertTriangle, Activity } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts'
import TopMelhoriasApneia from './TopMelhoriasApneia'

interface DashboardApneiaProps {
  userRole: string | null
}

interface KPIData {
  idoMedio: number
  casosCriticos: number
  spo2Medio: number
}

interface DistribuicaoIDO {
  name: string
  value: number
  color: string
}

interface TendenciaData {
  mes: string
  idoMedio: number
  spo2Medio: number
}

interface CasoCritico {
  paciente_nome: string
  ido: number
  ido_categoria: number
  spo2_min: number | null
  data_exame: string
}

export default function DashboardApneia({ userRole }: DashboardApneiaProps) {
  const [kpiData, setKpiData] = useState<KPIData>({
    idoMedio: 0,
    casosCriticos: 0,
    spo2Medio: 0,
  })
  const [distribuicao, setDistribuicao] = useState<DistribuicaoIDO[]>([])
  const [tendencia, setTendencia] = useState<TendenciaData[]>([])
  const [casosCriticos, setCasosCriticos] = useState<CasoCritico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7' | '30' | '60' | '90' | '180' | '365' | 'all'>('90')

  useEffect(() => {
    const fetchApneiaData = async () => {
      try {
        const supabase = createClient()

        // Calcular data inicial baseada no range selecionado
        const hoje = new Date()
        const dataInicial = new Date()
        
        if (dateRange === '7') {
          dataInicial.setDate(hoje.getDate() - 7)
        } else if (dateRange === '30') {
          dataInicial.setDate(hoje.getDate() - 30)
        } else if (dateRange === '60') {
          dataInicial.setDate(hoje.getDate() - 60)
        } else if (dateRange === '90') {
          dataInicial.setDate(hoje.getDate() - 90)
        } else if (dateRange === '180') {
          dataInicial.setMonth(hoje.getMonth() - 6)
        } else if (dateRange === '365') {
          dataInicial.setFullYear(hoje.getFullYear() - 1)
        } else if (dateRange === 'all') {
          dataInicial.setFullYear(2000) // Data muito antiga para pegar tudo
        } else {
          // Fallback para 90 dias
          dataInicial.setDate(hoje.getDate() - 90)
        }

        // Buscar exames de sono (tipo = 1) no período
        const { data: exames } = await supabase
          .from('exames')
          .select('id, paciente_id, data_exame, ido, ido_categoria, spo2_min, spo2_avg, spo2_max, pacientes!inner(nome)')
          .eq('tipo', 1)
          .gte('data_exame', dataInicial.toISOString().split('T')[0])
          .not('ido', 'is', null)
          .order('data_exame', { ascending: true })

        if (!exames || exames.length === 0) {
          setIsLoading(false)
          return
        }

        // KPI: IDO Médio
        const idos = exames.map((e: any) => parseFloat(e.ido)).filter((i: number) => !isNaN(i))
        const idoMedio = idos.length > 0 ? idos.reduce((a: number, b: number) => a + b, 0) / idos.length : 0

        // KPI: Casos Críticos (ido_categoria = 3)
        const casosCriticosCount = exames.filter((e: any) => e.ido_categoria === 3).length

        // KPI: SpO2 Médio
        const spo2s = exames
          .map((e: any) => parseFloat(e.spo2_avg))
          .filter((s: number) => !isNaN(s))
        const spo2Medio = spo2s.length > 0 ? spo2s.reduce((a: number, b: number) => a + b, 0) / spo2s.length : 0

        setKpiData({
          idoMedio,
          casosCriticos: casosCriticosCount,
          spo2Medio,
        })

        // Distribuição de IDO por categoria - sempre mostrar todas as categorias
        const distribuicaoData: DistribuicaoIDO[] = [
          { name: 'Normal', value: 0, color: '#22c55e' }, // success-500
          { name: 'Leve', value: 0, color: '#f59e0b' }, // warning-500
          { name: 'Moderado', value: 0, color: '#f97316' }, // orange-500
          { name: 'Acentuado', value: 0, color: '#ef4444' }, // danger-500
        ]

        exames.forEach((exame: any) => {
          const categoria = exame.ido_categoria
          if (categoria !== null && categoria >= 0 && categoria <= 3) {
            distribuicaoData[categoria].value++
          }
        })

        setDistribuicao(distribuicaoData)

        // Tendência: IDO e SpO2 médio por mês
        const examesPorMes: Record<string, { idos: number[]; spo2s: number[] }> = {}
        exames.forEach((exame: any) => {
          const data = new Date(exame.data_exame)
          const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
          if (!examesPorMes[mesAno]) {
            examesPorMes[mesAno] = { idos: [], spo2s: [] }
          }
          if (exame.ido !== null) {
            examesPorMes[mesAno].idos.push(parseFloat(exame.ido))
          }
          if (exame.spo2_avg !== null) {
            examesPorMes[mesAno].spo2s.push(parseFloat(exame.spo2_avg))
          }
        })

        const tendenciaData: TendenciaData[] = Object.entries(examesPorMes)
          .map(([mes, dados]) => ({
            mes,
            idoMedio: dados.idos.length > 0 ? dados.idos.reduce((a, b) => a + b, 0) / dados.idos.length : 0,
            spo2Medio: dados.spo2s.length > 0 ? dados.spo2s.reduce((a, b) => a + b, 0) / dados.spo2s.length : 0,
          }))
          .sort((a, b) => {
            const [mesA, anoA] = a.mes.split('/').map(Number)
            const [mesB, anoB] = b.mes.split('/').map(Number)
            if (anoA !== anoB) return anoA - anoB
            return mesA - mesB
          })

        setTendencia(tendenciaData)

        // Casos Críticos: Pacientes com IDO categoria 3, ordenados por IDO desc
        const casosCriticosData: CasoCritico[] = exames
          .filter((e: any) => e.ido_categoria === 3)
          .map((e: any) => ({
            paciente_nome: e.pacientes?.nome || 'N/A',
            ido: parseFloat(e.ido),
            ido_categoria: e.ido_categoria,
            spo2_min: e.spo2_min ? parseFloat(e.spo2_min) : null,
            data_exame: e.data_exame,
          }))
          .sort((a, b) => b.ido - a.ido)
          .slice(0, 20) // Top 20 casos críticos

        setCasosCriticos(casosCriticosData)
      } catch (error) {
        console.error('Erro ao buscar dados de apneia:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApneiaData()
  }, [dateRange])

  const isRecepcao = userRole === 'recepcao'

  const formatValue = (value: number, decimals = 2) => {
    if (isRecepcao) return '--'
    return value.toFixed(decimals)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg p-4">
        <label className="text-sm font-medium text-white drop-shadow mr-4">Período:</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/50"
        >
          <option value="7" className="bg-primary-900 text-white">Últimos 7 dias</option>
          <option value="30" className="bg-primary-900 text-white">Últimos 30 dias</option>
          <option value="60" className="bg-primary-900 text-white">Últimos 60 dias</option>
          <option value="90" className="bg-primary-900 text-white">Últimos 90 dias</option>
          <option value="180" className="bg-primary-900 text-white">Últimos 6 meses</option>
          <option value="365" className="bg-primary-900 text-white">Último ano</option>
          <option value="all" className="bg-primary-900 text-white">Todo o período</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">IDO Médio</h3>
            <div className="p-2 rounded-lg bg-primary-600 bg-opacity-10">
              <Activity className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatValue(kpiData.idoMedio, 1)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Casos Críticos</h3>
            <div className="p-2 rounded-lg bg-danger-600 bg-opacity-10">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatValue(kpiData.casosCriticos, 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">SpO2 Médio</h3>
            <div className="p-2 rounded-lg bg-success-600 bg-opacity-10">
              <Heart className="h-5 w-5 text-success-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatValue(kpiData.spo2Medio, 1)}%</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de IDO */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Categoria IDO</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis allowDecimals={false} />
              <Tooltip 
                formatter={(value: number) => [`${value} exames`, 'Quantidade']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="value" name="Quantidade">
                {distribuicao.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência de IDO e SpO2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de IDO e SpO2</h3>
          {tendencia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'IDO Médio') {
                      return [value.toFixed(2), name]
                    }
                    if (name === 'SpO2 Médio (%)') {
                      return [`${value.toFixed(2)}%`, name]
                    }
                    return [value, name]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="idoMedio"
                  stroke="#0284c7"
                  name="IDO Médio"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="spo2Medio"
                  stroke="#22c55e"
                  name="SpO2 Médio (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
          )}
        </div>
      </div>

      {/* Top 10 Melhorias */}
      <TopMelhoriasApneia dateRange={dateRange} userRole={userRole} />

      {/* Casos Críticos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-danger-600" />
          <h3 className="text-lg font-semibold text-gray-900">Casos Críticos (IDO Acentuado)</h3>
        </div>
        {casosCriticos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IDO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SpO2 Mínimo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data do Exame</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {casosCriticos.map((caso, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caso.paciente_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                        {formatValue(caso.ido)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.spo2_min !== null ? `${formatValue(caso.spo2_min)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caso.data_exame)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhum caso crítico encontrado no período</p>
        )}
      </div>
    </div>
  )
}

