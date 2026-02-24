'use client'

/**
 * Dashboard Admin Template
 * Beauty Smile Design System
 *
 * Template for admin dashboard with sidebar, metrics grid, and charts area
 */

import * as React from 'react'
import { useState, useEffect } from 'react'
import { LogOut, User, Settings, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../../utils/cn'
import { Glass } from '../../components/glass/Glass'
import NotificationCenter from '@/components/ui/NotificationCenter'

export interface MetricCardData {
  /**
   * Metric title
   */
  title: string
  /**
   * Metric value
   */
  value: string | number
  /**
   * Optional subtitle/description
   */
  subtitle?: string
  /**
   * Optional icon (React element)
   */
  icon?: React.ReactNode
  /**
   * Optional trend indicator
   */
  trend?: {
    value: number
    isPositive: boolean
  }
}

export interface SidebarNavItem {
  /**
   * Navigation item label
   */
  label: string
  /**
   * Navigation item icon (ReactNode only)
   */
  icon?: React.ReactNode
  /**
   * Whether this item is active
   */
  isActive?: boolean
  /**
   * Click handler
   */
  onClick?: () => void
}

export interface DashboardAdminTemplateProps {
  /**
   * Page title
   * @default 'Dashboard'
   */
  title?: string
  /**
   * User name to display in topbar
   */
  userName?: string
  /**
   * User avatar URL
   */
  userAvatar?: string
  /**
   * User email (for fetching user data)
   */
  userEmail?: string
  /**
   * Metric cards to display
   */
  metrics?: MetricCardData[]
  /**
   * Sidebar navigation items
   */
  navItems?: SidebarNavItem[]
  /**
   * Main content area (charts, tables, etc.)
   */
  children?: React.ReactNode
  /**
   * Callback when user menu is clicked
   */
  onUserMenuClick?: () => void
  /**
   * Callback when logout is clicked
   */
  onLogout?: () => void
  /**
   * Search component to display in header (optional)
   */
  searchComponent?: React.ReactNode
  /**
   * User role (admin, equipe, recepcao) - determines styling
   * If not provided, defaults to non-admin (equipe/recepcao)
   */
  userRole?: 'admin' | 'equipe' | 'recepcao' | string | null
  /**
   * Optional subtitle/description below the page title
   */
  description?: string
  /**
   * Additional class name
   */
  className?: string
}

/**
 * Dashboard Admin Template
 *
 * Pre-built dashboard template for admin area with dark sidebar, metrics grid, and content area.
 *
 * @example
 * ```tsx
 * <DashboardAdminTemplate
 *   title="Dashboard Principal"
 *   userName="João Silva"
 *   metrics={[
 *     { title: 'Total de Usuários', value: '1,234', trend: { value: 12, isPositive: true } },
 *     { title: 'Vendas Hoje', value: 'R$ 45.678', trend: { value: 8, isPositive: true } },
 *   ]}
 *   navItems={[
 *     { label: 'Dashboard', isActive: true, onClick: () => {} },
 *     { label: 'Usuários', onClick: () => {} },
 *     { label: 'Configurações', onClick: () => {} },
 *   ]}
 * >
 *   <div>Seu conteúdo aqui (gráficos, tabelas, etc.)</div>
 * </DashboardAdminTemplate>
 * ```
 */
export const DashboardAdminTemplate: React.FC<DashboardAdminTemplateProps> = ({
  title = 'Dashboard',
  description,
  userName,
  userAvatar,
  userEmail,
  metrics = [],
  navItems = [],
  children,
  onUserMenuClick,
  onLogout,
  searchComponent,
  userRole = null,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Determinar se é admin para aplicar estilos diferentes
  // Verificação estrita: apenas 'admin' (case-insensitive, sem espaços) é considerado admin
  // Qualquer outro valor ('equipe', 'recepcao', null, undefined, '') é tratado como não-admin
  const normalizedRole = typeof userRole === 'string' 
    ? userRole.toLowerCase().trim() 
    : ''
  const isAdmin = normalizedRole === 'admin'

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const menuElement = document.querySelector('[data-user-menu]')
      if (menuElement && !menuElement.contains(target)) {
        setShowMenu(false)
      }
    }

    // Usar setTimeout para não capturar o próprio clique que abriu o menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    const fetchUser = async () => {
      // Se userEmail não foi passado, tentar buscar do contexto
      if (!userEmail) return
      
      // Aqui você pode adicionar lógica para buscar dados do usuário se necessário
      // Por enquanto, usamos os dados passados via props
    }
    fetchUser()
  }, [userEmail])

  const userInitials = userData?.nome
    ? userData.nome
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userName
      ? userName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U'

  // Background baseado no role: admin usa imagem específica, não-admin usa outro background
  const backgroundImage = isAdmin 
    ? 'url(/68a4d045b130b34b3614881d.jpeg)'
    : 'url(/68a4d05373c7b3161e742edd.png)'
  
  const containerStyle: React.CSSProperties = {
    backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  }

  return (
    <div 
      className={cn('flex h-screen relative', className)}
      style={containerStyle}
    >
      {/* Sidebar - Dark para admin, Light para equipe/público */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[60]',
          'flex flex-col transform transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          isAdmin
            ? 'bg-primary-900 text-white'
            : 'bg-white text-neutral-900 border-r border-neutral-200'
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'flex items-center justify-center relative',
          isCollapsed ? 'p-4' : 'p-6',
          isAdmin ? 'border-b border-white/10' : 'border-b border-neutral-200'
        )}>
          {!isCollapsed ? (
            <img
              src="/beauty-smile-logo.svg"
              alt="Beauty Smile"
              className={cn(
                "h-12 w-auto transition-opacity duration-300",
                isAdmin ? "filter brightness-0 invert" : ""
              )}
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/beauty-smile-icon.svg"
                alt="Beauty Smile"
                className={cn(
                  "w-10 h-10 transition-all duration-300",
                  isAdmin ? "filter brightness-0 invert" : ""
                )}
              />
            </div>
          )}
          
          {/* Toggle Button - Only on desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg hidden md:flex z-[70]",
              isAdmin
                ? "border-white/20 bg-primary-800 text-white hover:bg-primary-700"
                : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            )}
            title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 space-y-2',
          isCollapsed ? 'p-2' : 'p-4'
        )}>
          {navItems.map((item, index) => {
            return (
              <button
                key={index}
                onClick={item.onClick}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg transition-colors',
                  isCollapsed 
                    ? 'justify-center px-2 py-3' 
                    : 'gap-3 px-4 py-3 w-full',
                  item.isActive
                    ? isAdmin
                      ? 'bg-primary-700 text-white'
                      : 'bg-primary-100 text-primary-800'
                    : isAdmin
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0">
                    {React.isValidElement(item.icon) ? (
                      React.cloneElement(item.icon as React.ReactElement<any>, {
                        className: cn('h-5 w-5', (item.icon as React.ReactElement<any>)?.props?.className)
                      })
                    ) : (
                      item.icon
                    )}
                  </span>
                )}
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        {userName && (
          <div className={cn(
            isAdmin ? 'border-t border-white/10' : 'border-t border-neutral-200',
            isCollapsed ? 'p-2' : 'p-4'
          )}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isAdmin ? "bg-primary-700" : "bg-neutral-200"
                    )}>
                      <span className={cn(
                        "text-lg font-semibold",
                        isAdmin ? "text-white" : "text-neutral-700"
                      )}>
                        {userName
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isAdmin ? "text-white" : "text-neutral-900"
                    )}>{userName}</p>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className={cn(
                      "w-full px-4 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2",
                      isAdmin
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isAdmin ? "bg-primary-700" : "bg-neutral-200"
                  )}>
                    <span className={cn(
                      "text-lg font-semibold",
                      isAdmin ? "text-white" : "text-neutral-700"
                    )}>
                      {userName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sair"
                    className={cn(
                      "w-full px-2 py-2 text-sm rounded-lg transition-colors flex items-center justify-center",
                      isAdmin
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300',
        isCollapsed ? 'ml-16' : 'ml-64'
      )} style={{ background: 'transparent' }}>
        {/* Top Bar - com arredondamento apenas embaixo e estilo glass */}
        <header className="h-16 sticky top-0 z-50 w-full px-4 md:px-6">
          <div className="h-full w-full rounded-b-xl border-b border-white/20 bg-white/10 backdrop-blur-lg relative" style={{ pointerEvents: 'none' }}>
            <div
              className={cn(
                "flex items-center pl-8 pr-4 md:pl-12 md:pr-8 h-full gap-2 relative md:grid md:gap-2",
                isCollapsed
                  ? "md:grid-cols-[1fr_minmax(0,48rem)_1fr]"
                  : "md:grid-cols-[1fr_minmax(0,34rem)_1fr]"
              )}
              style={{
                pointerEvents: 'auto',
                transition: 'grid-template-columns 0.3s ease-in-out',
              }}
            >
                {/* Lado esquerdo - título só no mobile */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <h1 className="text-xl font-bold text-white md:hidden">{title}</h1>
                </div>
                
                {/* Busca Global - centralizada, mesma largura do conteúdo; reduz com sidebar aberta; animação */}
                {searchComponent && (
                <div className="hidden md:flex items-center min-w-0">
                  <div
                    className={cn(
                      "w-full min-w-0 mr-8 transition-[max-width] duration-300 ease-in-out",
                      isCollapsed ? "max-w-[48rem]" : "max-w-[34rem]"
                    )}
                  >
                    {searchComponent}
                  </div>
                </div>
                )}
                
                {/* Lado direito - notificação e perfil */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 justify-end pl-4 relative z-[10000]" data-user-menu style={{ pointerEvents: 'auto' }}>
                <div className="shrink-0 ml-24">
                  <NotificationCenter />
                </div>
                <div className="relative">
                    <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu((prev) => !prev)
                    }}
                    className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors relative z-[100] cursor-pointer"
                    type="button"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                    >
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold flex-shrink-0">
                        {userInitials}
                    </div>
                    <span className="hidden lg:block text-white truncate max-w-[120px]">{userName || 'Usuário'}</span>
                    <ChevronDown className={cn("h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0 transition-transform", showMenu && "rotate-180")} />
                    </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-[70] overflow-hidden">
                      <Link
                        href="/perfil"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors rounded-t-lg"
                        onClick={() => setShowMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        Perfil
                      </Link>
                      <Link
                        href="/configuracoes"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors rounded-b-lg"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Link>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto pl-8 pr-4 md:pl-12 md:pr-8 pt-8 pb-4 md:pb-8" style={{ background: 'transparent' }}>
          {/* Title and Description */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-heading text-white">{title}</h1>
            <p className="mt-2 text-white/90">{description ?? 'Vis\u00E3o geral do sistema Beauty Sleep'}</p>
          </div>
          
          {/* Metrics Grid */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {metrics.map((metric, index) => (
                <Glass
                  key={index} 
                  variant="light"
                  blur="lg"
                  className={cn(
                    "p-6 rounded-lg border",
                    isAdmin
                      ? "border-white/20"
                      : "border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">{metric.title}</h3>
                    {metric.icon && (
                      <span className="text-white">{metric.icon}</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-white">
                      {metric.value}
                    </p>
                    {metric.trend && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          metric.trend.isPositive
                            ? 'text-green-400'
                            : 'text-red-400'
                        )}
                      >
                        {metric.trend.isPositive ? '+' : '-'}
                        {Math.abs(metric.trend.value)}%
                      </span>
                    )}
                  </div>
                  {metric.subtitle && (
                    <p className="text-xs mt-2 text-white/70">
                      {metric.subtitle}
                    </p>
                  )}
                </Glass>
              ))}
            </div>
          )}

          {/* Main Content Area (Charts, Tables, etc.) */}
          {children && <div className="space-y-6">{children}</div>}
        </div>
      </main>
    </div>
  )
}

DashboardAdminTemplate.displayName = 'DashboardAdminTemplate'
