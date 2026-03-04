'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCog, FileText, LogOut, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import { useSidebar } from '@/components/providers/SidebarProvider'

/** Links externos (outros sites da rede) */
const REDE_LINKS_EXTERNOS = [
  { href: 'https://dash-unidades-bs.vercel.app', label: 'Beauty Smile Partners', external: true as const },
]

interface SidebarProps {
  userRole?: string | null
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ userRole, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentRole, setCurrentRole] = useState<string | null>(userRole || null)
  const [userData, setUserData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const { isCollapsed, toggleCollapsed } = useSidebar()

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser?.email) {
        setUser(authUser)
        const { data: userDataFromDb } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single()
        
        if (userDataFromDb) {
          setUserData(userDataFromDb)
          if (!currentRole) {
            setCurrentRole(userDataFromDb.role)
          }
        }
      }
    }
    fetchUserData()
  }, [currentRole])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro ao fazer logout:', error)
      }
      
      // Force clear any cached data and redirect to login with cache bust
      window.location.href = '/login?logout=true'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Even if there's an error, redirect to login
      window.location.href = '/login?logout=true'
    }
  }

  const normalizedRole = typeof currentRole === 'string' 
    ? currentRole.toLowerCase().trim() 
    : ''
  const isAdmin = normalizedRole === 'admin'
  const userName = userData?.nome || user?.email || 'Usuário'
  const userInitials = userData?.nome
    ? userData.nome
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', href: '/pacientes', icon: Users },
    ...(isAdmin ? [
      { name: 'Usuários', href: '/usuarios', icon: UserCog },
      { name: 'Alertas', href: '/alertas', icon: AlertCircle },
      { name: 'Logs', href: '/logs', icon: FileText },
    ] : [
      { name: 'Alertas', href: '/alertas', icon: AlertCircle },
    ]),
  ]

  const redeLinks = REDE_LINKS_EXTERNOS
  const [redeOpen, setRedeOpen] = useState(false)
  const redeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (redeRef.current && !redeRef.current.contains(e.target as Node)) setRedeOpen(false)
    }
    if (redeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [redeOpen])

  // Fechar dropdown quando a sidebar for recolhida
  useEffect(() => {
    if (isCollapsed && !isMobileOpen) setRedeOpen(false)
  }, [isCollapsed, isMobileOpen])

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      {/* Sidebar - Dark para admin, Light para equipe/público */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50',
          'flex flex-col transform transition-all duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          // No mobile sempre w-64 quando aberta, no desktop usa collapsed state
          !isMobileOpen && (isCollapsed ? 'md:w-16' : 'md:w-64'),
          isAdmin
            ? 'bg-primary-900 text-white'
            : 'bg-white text-neutral-900 border-r border-neutral-200'
        )}
      >
        {/* Logo Section: botão dropdown + botão recolher (botão na ponta direita) */}
        <div className={cn(
          'flex items-center justify-between gap-2 relative z-10 shrink-0',
          isCollapsed && !isMobileOpen ? 'p-3' : 'p-4',
          isAdmin ? 'border-b border-white/10' : 'border-b border-neutral-200'
        )}>
          <div
            ref={redeRef}
            className={cn(
              'flex items-center justify-center gap-2 overflow-visible',
              (isCollapsed && !isMobileOpen) ? 'min-w-[2.5rem] flex-shrink-0' : 'flex-1 min-w-0'
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (isCollapsed && !isMobileOpen) return
                setRedeOpen((v) => !v)
              }}
              className={cn(
                'outline-none focus:outline-none flex items-center gap-2 overflow-visible',
                (isCollapsed && !isMobileOpen) ? 'flex-shrink-0' : 'min-w-0 flex-1'
              )}
              aria-expanded={redeOpen}
              aria-haspopup="true"
            >
              {(!isCollapsed || isMobileOpen) ? (
                <>
                  <span className="flex-shrink-0">
                    <img
                      src="/beauty-smile-logo.svg"
                      alt="Beauty Sleep"
                      className={cn(
                        'h-10 w-auto',
                        isAdmin ? 'filter brightness-0 invert' : ''
                      )}
                    />
                  </span>
                  <span className="font-semibold truncate min-w-0 flex-1 text-left">
                    <span className={isAdmin ? 'text-white' : 'text-neutral-900'}>Beauty Sleep</span>
                  </span>
                </>
              ) : (
                <img
                  src="/beauty-smile-icon.svg"
                  alt="Beauty Sleep"
                  className={cn(
                    'w-10 h-10 flex-shrink-0 min-w-[2.5rem] min-h-[2.5rem]',
                    isAdmin ? 'filter brightness-0 invert' : ''
                  )}
                />
              )}
            </button>

            {/* Dropdown Sites da rede - só quando sidebar expandida */}
            {redeOpen && !(isCollapsed && !isMobileOpen) && (
              <div
                className="absolute left-1/2 top-full z-[100] mt-1 w-52 -translate-x-1/2 rounded-lg border border-white/15 bg-[#0f172a] shadow-xl overflow-hidden"
              >
                <div className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 text-center">
                  Sites da rede
                </div>
                <div className="py-1">
                  {redeLinks.map((item) => (
                    'external' in item && item.external ? (
                      <a
                        key={item.href + item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 transition-colors whitespace-nowrap"
                        onClick={() => setRedeOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        className="block w-full px-4 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 transition-colors whitespace-nowrap"
                        onClick={() => setRedeOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botão de fechar no mobile */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'w-8 h-8 rounded-full border-2',
                'flex items-center justify-center',
                'md:hidden z-50',
                isAdmin
                  ? 'bg-primary-800 border-white/20 text-white hover:bg-primary-700'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              )}
              title="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Botão recolher/expandir - na ponta direita da sidebar (meio fora) */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 z-[20] w-6 h-6 rounded-full border-2',
              'flex items-center justify-center',
              'shadow-lg hidden md:flex',
              isAdmin
                ? 'bg-primary-800 border-white/20 text-white hover:bg-primary-700'
                : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
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
        <nav
          data-tour="sidebar-nav"
          className={cn(
          'flex-1 space-y-2 relative z-0 min-h-0 overflow-y-auto overflow-x-hidden',
          (isCollapsed && !isMobileOpen) ? 'p-2' : 'p-4'
        )}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                data-tour={item.name === 'Pacientes' ? 'nav-pacientes' : undefined}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center rounded-lg transition-colors',
                  (isCollapsed && !isMobileOpen)
                    ? 'justify-center px-2 py-3' 
                    : 'gap-3 px-4 py-3 w-full',
                  isActive
                    ? isAdmin
                      ? 'bg-primary-700 text-white'
                      : 'bg-primary-100 text-primary-800'
                    : isAdmin
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                <item.icon className={cn(
                  'flex-shrink-0',
                  isCollapsed ? 'h-5 w-5' : 'h-5 w-5'
                )} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className={cn(
          isAdmin ? 'border-t border-white/10' : 'border-t border-neutral-200',
          (isCollapsed && !isMobileOpen) ? 'p-2' : 'p-4'
        )}>
          {(!isCollapsed || isMobileOpen) ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isAdmin ? "bg-primary-700" : "bg-neutral-200"
                )}>
                  <span className={cn(
                    "text-lg font-semibold",
                    isAdmin ? "text-white" : "text-neutral-700"
                  )}>
                    {userInitials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isAdmin ? "text-white" : "text-neutral-900"
                  )}>
                    {userName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
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
                    {userInitials}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
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
            </>
          )}
        </div>
      </aside>
    </>
  )
}

