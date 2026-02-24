'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, ChevronDown, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BuscaGlobal from './BuscaGlobal'
import NotificationCenter from './NotificationCenter'
import { useSidebar } from '@/components/providers/SidebarProvider'
import { cn } from '@/utils/cn'

interface HeaderProps {
  userRole?: string | null
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export default function Header({ userRole, onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { isCollapsed } = useSidebar()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      // Force refresh to get latest user data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Error fetching auth user:', authError)
        return
      }

      if (authUser?.email) {
        setUser(authUser)
        // Fetch user data from users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else if (data) {
          setUserData(data)
        }
      }
    }
    fetchUser()

    // Listen for auth state changes (e.g., after login/logout)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const menuElement = document.querySelector('[data-user-menu]')
      
      // Não fechar se clicar em qualquer elemento dentro do menu
      if (menuElement && menuElement.contains(target)) {
        return
      }
      
      // Não fechar se clicar em um link ou botão
      if (target.closest('a') || target.closest('button')) {
        return
      }
      
      // Fechar apenas se clicar fora do menu
      if (menuElement && !menuElement.contains(target)) {
        setShowMenu(false)
      }
    }

    // Usar setTimeout para não capturar o próprio clique que abriu o menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 200)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const userInitials = userData?.nome
    ? userData.nome
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <header className={cn(
      "h-16 sticky top-0 z-[100] w-full px-4 md:px-6"
    )}>
      <div className="h-full w-full rounded-b-xl border-b border-white/20 bg-white/10 backdrop-blur-lg relative" style={{ pointerEvents: 'none' }}>
        <div
          className={cn(
            "flex items-center pl-8 pr-4 md:pl-12 md:pr-8 h-full gap-2 relative z-10 md:grid md:gap-2",
            isCollapsed
              ? "md:grid-cols-[1fr_minmax(0,48rem)_1fr]"
              : "md:grid-cols-[1fr_minmax(0,34rem)_1fr]"
          )}
          style={{
            pointerEvents: 'auto',
            transition: 'grid-template-columns 0.3s ease-in-out',
          }}
        >
          {/* Lado esquerdo */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
            <img 
              src="/Logo.png" 
              alt="Beauty Sleep Logo" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain hidden sm:block md:hidden flex-shrink-0"
            />
          </div>
          
          {/* Busca Global - centralizada, mesma largura do conteúdo; reduz com sidebar aberta; animação */}
          <div className="hidden md:flex items-center min-w-0">
            <div
              className={cn(
                "w-full min-w-0 mr-8 transition-[max-width] duration-300 ease-in-out",
                isCollapsed ? "max-w-[48rem]" : "max-w-[34rem]"
              )}
            >
              <BuscaGlobal />
            </div>
          </div>
          
          {/* Lado direito - notificação e perfil */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 justify-end pl-4 relative z-[10000]" data-user-menu style={{ pointerEvents: 'auto' }}>
            <div className="shrink-0 ml-24">
              <NotificationCenter />
            </div>
            
            <div className="relative z-[10000]" style={{ pointerEvents: 'auto' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu((prev) => !prev)
                }}
                className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors relative z-[10000] cursor-pointer"
                type="button"
                aria-expanded={showMenu}
                aria-haspopup="true"
              >
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold flex-shrink-0">
                  {userInitials}
                </div>
                <span className="hidden lg:block text-white truncate max-w-[120px]">{userData?.nome || user?.email}</span>
                <ChevronDown className={cn("h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0 transition-transform", showMenu && "rotate-180")} />
              </button>
              {showMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-[10001] overflow-hidden" 
                  onClick={(e) => e.stopPropagation()} 
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ pointerEvents: 'auto', zIndex: 10001 }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(false)
                      // Usar setTimeout para garantir que o estado seja atualizado antes da navegação
                      setTimeout(() => {
                        router.push('/perfil')
                      }, 10)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-left rounded-t-lg"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(false)
                      // Usar setTimeout para garantir que o estado seja atualizado antes da navegação
                      setTimeout(() => {
                        router.push('/configuracoes')
                      }, 10)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-left rounded-b-lg"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
