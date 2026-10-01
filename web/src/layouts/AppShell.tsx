import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  Award,
  BarChart2,
  Bell,
  CheckSquare,
  Flame,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { useAuth } from '#/contexts/AuthContext'
import { useAppData } from '#/contexts/AppDataContext'
import appIcon from '#/assets/images/icon.png'
import { NotificationToast } from '#/components/common/NotificationToast'
import { PwaInstallButton } from '#/components/common/PwaInstallButton'
import { PushToggle } from '#/components/notifications/PushToggle'
import { TaskModal } from '#/components/mother/TaskModal'
import { AddDaughterWizard } from '#/components/mother/AddDaughterWizard'

const MOTHER_LINKS = [
  {
    to: '/app/mae/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    mobile: 'Início',
  },
  {
    to: '/app/mae/tarefas',
    label: 'Tarefas',
    icon: CheckSquare,
    mobile: 'Tarefas',
  },
  { to: '/app/mae/filhas', label: 'Filhas', icon: Users, mobile: 'Filhas' },
  {
    to: '/app/mae/relatorios',
    label: 'Relatórios',
    icon: BarChart2,
    mobile: 'Evolução',
  },
  {
    to: '/app/mae/notificacoes',
    label: 'Notificações',
    icon: Bell,
    mobile: 'Alertas',
  },
] as const

const DAUGHTER_LINKS = [
  { to: '/app/filha/hoje', label: 'Hoje', icon: CheckSquare, mobile: 'Hoje' },
  {
    to: '/app/filha/progresso',
    label: 'Progresso',
    icon: BarChart2,
    mobile: 'Progresso',
  },
  {
    to: '/app/filha/conquistas',
    label: 'Conquistas',
    icon: Award,
    mobile: 'Conquistas',
  },
] as const

export function AppShell() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const {
    hydrated,
    activeToast,
    dismissToast,
    daughters,
    activeDaughter,
    selectedDaughterId,
    isTaskModalOpen,
    editingTask,
    closeTaskModal,
    handleSaveTask,
    isAddDaughterOpen,
    closeAddDaughter,
    handleAddDaughter,
    notificationRule,
  } = useAppData()

  const isMother = role === 'mother'
  const navLinks = isMother ? MOTHER_LINKS : DAUGHTER_LINKS
  const defaultHome = isMother ? '/app/mae/dashboard' : '/app/filha/hoje'
  const userLabel = isMother ? (user?.name ?? '') : activeDaughter.name
  const userRoleLabel = isMother ? 'Mãe' : 'Filha'

  useEffect(() => {
    if (isMother && pathname.startsWith('/app/filha')) {
      navigate({ to: '/app/mae/dashboard' })
    }
    if (!isMother && pathname.startsWith('/app/mae')) {
      navigate({ to: '/app/filha/hoje' })
    }
  }, [isMother, pathname, navigate])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-[#6B7280] text-sm">
        <img
          src={appIcon}
          alt="Minha Rotina"
          className="w-14 h-14 rounded-2xl animate-pulse"
        />
        Carregando sua rotina…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col selection:bg-[#EEF0FF] selection:text-[#4A4BCF]">
      <NotificationToast notification={activeToast} onDismiss={dismissToast} />

      <header className="sticky top-0 z-40 ui-chrome-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            <Link
              to={defaultHome}
              className="text-lg font-bold tracking-tight text-[#111827] flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
            >
              <img
                src={appIcon}
                alt="Minha Rotina"
                className="w-8 h-8 rounded-xl object-cover shadow-xs"
              />
              <span>Minha Rotina</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">
                  {userLabel}
                </p>
                <p className="text-[11px] text-[#6B7280]">{userRoleLabel}</p>
              </div>
              <PwaInstallButton />
              <PushToggle preferences={notificationRule} />
              <button
                type="button"
                onClick={() => {
                  void logout()
                }}
                title="Sair"
                className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 -mt-0.5">
            {navLinks.map((tab) => {
              const Icon = tab.icon
              const active = pathname === tab.to
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#EEF0FF] text-[#4A4BCF]'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? 'text-[#5B5CE2]' : 'text-slate-400'}`}
                  />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 py-4 sm:py-6 pb-24 sm:pb-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 ui-chrome-bottom px-2 py-1 flex items-center justify-around safe-area-pb">
        {isMother
          ? MOTHER_LINKS.filter((l) => l.to !== '/app/mae/notificacoes').map(
              (tab) => {
                const Icon = tab.icon
                const active = pathname === tab.to
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] ${
                      active ? 'text-[#5B5CE2]' : 'text-[#6B7280]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold mt-0.5">
                      {tab.mobile}
                    </span>
                  </Link>
                )
              },
            )
          : DAUGHTER_LINKS.map((tab) => {
              const Icon =
                tab.icon === BarChart2 && tab.mobile === 'Progresso'
                  ? Flame
                  : tab.icon
              const active = pathname === tab.to
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center py-1.5 px-3 min-w-[64px] ${
                    active ? 'text-[#5B5CE2]' : 'text-[#6B7280]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold mt-0.5">
                    {tab.mobile}
                  </span>
                </Link>
              )
            })}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        initialTask={editingTask}
        daughters={daughters}
        selectedDaughterId={selectedDaughterId}
      />

      <AddDaughterWizard
        isOpen={isAddDaughterOpen}
        onClose={closeAddDaughter}
        onAddDaughter={handleAddDaughter}
      />
    </div>
  )
}
