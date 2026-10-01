import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type {
  Achievement,
  CompletionPoints,
  Daughter,
  DashboardSummary,
  DailyReport,
  NotificationItem,
  NotificationRule,
  PointsSummary,
  Task,
} from '#/types'
import {
  achievementsApi,
  ApiError,
  dashboardApi,
  daughtersApi,
  notificationRulesApi,
  notificationsApi,
  tasksApi,
} from '#/services/api'
import type { DaughterPayload, TaskPayload } from '#/services/api'
import { avatarFallback } from '#/mocks/avatars'
import { useAuth } from '#/contexts/AuthContext'

const DEFAULT_RULE: NotificationRule = {
  id: 'default',
  enabled: true,
  frequency: 'moderada',
  startTime: '07:00',
  endTime: '21:00',
  notifyMotherOnComplete: true,
  notifyMotherOnDelay: true,
  daughterReminderMinutesBefore: 15,
}

const EMPTY_DAUGHTER: Daughter = {
  id: '',
  name: '',
  age: 0,
  avatarUrl: '',
  status: 'active',
  streakDays: 0,
  totalPoints: 0,
  completedTodayCount: 0,
  totalTodayCount: 0,
  schoolGrade: '',
}

function withAvatar(daughter: Daughter): Daughter {
  return {
    ...daughter,
    avatarUrl:
      daughter.avatarUrl || avatarFallback(daughter.name || daughter.id),
  }
}

type AppDataContextValue = {
  hydrated: boolean
  daughters: Daughter[]
  selectedDaughterId: string
  activeDaughter: Daughter
  tasks: Task[]
  achievements: Achievement[]
  pointsSummary: PointsSummary | null
  notifications: NotificationItem[]
  notificationRule: NotificationRule
  summary: DashboardSummary | null
  weeklyReports: DailyReport[]
  activeToast: NotificationItem | null
  isTaskModalOpen: boolean
  editingTask: Task | null
  isAddDaughterOpen: boolean
  setSelectedDaughterId: (id: string) => void
  setNotificationRule: (rule: NotificationRule) => void
  dismissToast: () => void
  openCreateTask: () => void
  openEditTask: (task: Task) => void
  closeTaskModal: () => void
  openAddDaughter: () => void
  closeAddDaughter: () => void
  handleToggleTask: (task: Task) => Promise<CompletionPoints | null>
  handleSaveTask: (taskData: TaskPayload & { id?: string }) => void
  handleDuplicateTask: (task: Task) => void
  handleDeleteTask: (taskId: string) => void
  handleAddDaughter: (data: DaughterPayload) => Promise<void>
  handleToggleDaughterStatus: (id: string) => void
  handleSendTestNotification: (
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>,
  ) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth()
  const isMother = role === 'mother'
  const isDaughter = role === 'daughter'

  const [hydrated, setHydrated] = useState(false)
  const [daughters, setDaughters] = useState<Daughter[]>([])
  const [selectedDaughterId, setSelectedDaughterId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notificationRule, setNotificationRuleState] =
    useState<NotificationRule>(DEFAULT_RULE)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isAddDaughterOpen, setIsAddDaughterOpen] = useState(false)

  const toastTimer = useRef<number | null>(null)
  const seenNotifications = useRef<Set<string>>(new Set())
  const notificationsBootstrapped = useRef(false)

  const showToast = useCallback((notification: NotificationItem) => {
    setActiveToast(notification)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setActiveToast(null), 4500)
  }, [])

  const ingestNotifications = useCallback(
    (items: NotificationItem[], allowToast: boolean) => {
      setNotifications(items)

      if (!notificationsBootstrapped.current) {
        items.forEach((item) => seenNotifications.current.add(item.id))
        notificationsBootstrapped.current = true
        return
      }

      const fresh = items.filter(
        (item) =>
          !item.read &&
          !seenNotifications.current.has(item.id) &&
          item.recipient === role,
      )

      items.forEach((item) => seenNotifications.current.add(item.id))

      if (allowToast && fresh[0]) {
        showToast(fresh[0])
      }
    },
    [role, showToast],
  )

  const loadDaughters = useCallback(async () => {
    const list = await daughtersApi.list()
    const withAvatars = list.map(withAvatar)
    setDaughters(withAvatars)
    return withAvatars
  }, [])

  const loadDaughterData = useCallback(async () => {
    if (!user) return

    const daughterId = isMother ? selectedDaughterId || undefined : undefined

    try {
      const [taskList, summaryData, achievementsData, notificationList] =
        await Promise.all([
          isDaughter
            ? tasksApi.agenda()
            : tasksApi.list(daughterId ? { daughterId } : {}),
          dashboardApi.summary(daughterId ? { daughterId } : {}),
          achievementsApi.list(daughterId),
          notificationsApi.list(),
        ])

      setTasks(taskList)
      setSummary(summaryData)
      setAchievements(achievementsData.data)
      setPointsSummary(achievementsData.points)
      ingestNotifications(notificationList, true)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        console.error('Falha ao carregar dados da rotina.', error)
      }
    }
  }, [user, isMother, isDaughter, selectedDaughterId, ingestNotifications])

  // Carga inicial: perfil + filhas + regra + notificações.
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const bootstrap = async () => {
      try {
        const [list, rule, notificationList] = await Promise.all([
          daughtersApi.list(),
          notificationRulesApi.show(),
          notificationsApi.list(),
        ])

        if (cancelled) return

        setDaughters(list.map(withAvatar))
        setNotificationRuleState(rule)
        ingestNotifications(notificationList, false)
        setSelectedDaughterId((previous) => {
          if (isDaughter && user.daughterId) return user.daughterId
          if (previous && list.some((daughter) => daughter.id === previous)) {
            return previous
          }
          return list[0]?.id ?? ''
        })
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error('Falha ao carregar perfil.', error)
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [user, isDaughter, ingestNotifications])

  // Dados dependentes da filha selecionada (tarefas, dashboard, conquistas).
  useEffect(() => {
    if (!hydrated || !user) return
    if (isMother && !selectedDaughterId) return

    void loadDaughterData()
  }, [hydrated, user, isMother, selectedDaughterId, loadDaughterData])

  // Atualização periódica (RN005: painel próximo do tempo real).
  useEffect(() => {
    if (!hydrated || !user) return

    const interval = window.setInterval(() => {
      void loadDaughterData()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [hydrated, user, loadDaughterData])

  // Limpa estado ao sair.
  useEffect(() => {
    if (user) return

    setDaughters([])
    setTasks([])
    setAchievements([])
    setPointsSummary(null)
    setNotifications([])
    setSummary(null)
    setHydrated(false)
    seenNotifications.current = new Set()
    notificationsBootstrapped.current = false
  }, [user])

  const activeDaughter =
    daughters.find((daughter) => daughter.id === selectedDaughterId) ??
    daughters.at(0) ??
    EMPTY_DAUGHTER

  const setNotificationRule = useCallback((rule: NotificationRule) => {
    setNotificationRuleState(rule)
    void notificationRulesApi.update(rule).catch((error) => {
      console.error('Falha ao salvar preferências de notificação.', error)
    })
  }, [])

  const dismissToast = useCallback(() => setActiveToast(null), [])

  const openCreateTask = useCallback(() => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }, [])

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }, [])

  const openAddDaughter = useCallback(() => setIsAddDaughterOpen(true), [])
  const closeAddDaughter = useCallback(() => setIsAddDaughterOpen(false), [])

  const handleToggleTask = useCallback(
    async (task: Task): Promise<CompletionPoints | null> => {
      const isComplete = task.status === 'concluido'

      try {
        let points: CompletionPoints | null = null

        if (isComplete) {
          await tasksApi.uncomplete(task.id, task.date)
        } else {
          const response = await tasksApi.complete(task.id, task.date)
          points = response.points
        }

        await Promise.all([loadDaughterData(), loadDaughters()])
        return points
      } catch (error) {
        console.error('Falha ao atualizar a tarefa.', error)
        return null
      }
    },
    [loadDaughterData, loadDaughters],
  )

  const handleSaveTask = useCallback(
    async (taskData: TaskPayload & { id?: string }) => {
      try {
        if (taskData.id) {
          await tasksApi.update(taskData.id, taskData)
        } else {
          await tasksApi.create(taskData)
        }

        setEditingTask(null)
        setIsTaskModalOpen(false)
        await loadDaughterData()
      } catch (error) {
        console.error('Falha ao salvar a tarefa.', error)
      }
    },
    [loadDaughterData],
  )

  const handleDuplicateTask = useCallback(
    async (task: Task) => {
      try {
        await tasksApi.duplicate(task.id)
        await loadDaughterData()
      } catch (error) {
        console.error('Falha ao duplicar a tarefa.', error)
      }
    },
    [loadDaughterData],
  )

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm('Tem certeza que deseja excluir esta tarefa da rotina?'))
        return

      try {
        await tasksApi.remove(taskId)
        await loadDaughterData()
      } catch (error) {
        console.error('Falha ao excluir a tarefa.', error)
      }
    },
    [loadDaughterData],
  )

  const handleAddDaughter = useCallback(async (data: DaughterPayload) => {
    const created = await daughtersApi.create(data)
    setDaughters((previous) => [...previous, withAvatar(created)])
    setSelectedDaughterId(created.id)
    setIsAddDaughterOpen(false)
  }, [])

  const handleToggleDaughterStatus = useCallback(
    async (id: string) => {
      const daughter = daughters.find((item) => item.id === id)
      if (!daughter) return

      const nextStatus = daughter.status === 'active' ? 'paused' : 'active'

      setDaughters((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item,
        ),
      )

      try {
        await daughtersApi.updateStatus(id, nextStatus)
      } catch (error) {
        console.error('Falha ao atualizar o status da filha.', error)
        await loadDaughters()
      }
    },
    [daughters, loadDaughters],
  )

  const handleSendTestNotification = useCallback(
    async (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      try {
        const notification = await notificationsApi.sendTest({
          title: item.title,
          message: item.message,
          recipient: item.recipient,
          daughterId:
            item.recipient === 'daughter' ? selectedDaughterId : undefined,
        })

        ingestNotifications([notification, ...notifications], false)
        showToast(notification)
      } catch (error) {
        console.error('Falha ao enviar notificação de teste.', error)
      }
    },
    [notifications, selectedDaughterId, ingestNotifications, showToast],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({
      hydrated,
      daughters,
      selectedDaughterId,
      activeDaughter,
      tasks,
      achievements,
      pointsSummary,
      notifications,
      notificationRule,
      summary,
      weeklyReports: summary?.weeklySeries ?? [],
      activeToast,
      isTaskModalOpen,
      editingTask,
      isAddDaughterOpen,
      setSelectedDaughterId,
      setNotificationRule,
      dismissToast,
      openCreateTask,
      openEditTask,
      closeTaskModal,
      openAddDaughter,
      closeAddDaughter,
      handleToggleTask,
      handleSaveTask,
      handleDuplicateTask,
      handleDeleteTask,
      handleAddDaughter,
      handleToggleDaughterStatus,
      handleSendTestNotification,
    }),
    [
      hydrated,
      daughters,
      selectedDaughterId,
      activeDaughter,
      tasks,
      achievements,
      pointsSummary,
      notifications,
      notificationRule,
      summary,
      activeToast,
      isTaskModalOpen,
      editingTask,
      isAddDaughterOpen,
      setNotificationRule,
      dismissToast,
      openCreateTask,
      openEditTask,
      closeTaskModal,
      openAddDaughter,
      closeAddDaughter,
      handleToggleTask,
      handleSaveTask,
      handleDuplicateTask,
      handleDeleteTask,
      handleAddDaughter,
      handleToggleDaughterStatus,
      handleSendTestNotification,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx)
    throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return ctx
}
