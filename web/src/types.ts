export type UserRole = 'mother' | 'daughter' | 'guest'

export interface AuthUser {
  id: string
  role: 'mother' | 'daughter'
  name: string
  email: string
  familyName?: string | null
  familyId?: number | null
  daughterId: string | null
  avatarUrl: string | null
  birthdate?: string | null
  schoolGrade?: string | null
}

export type TaskCategory = 'estudos' | 'saude' | 'casa' | 'lazer' | 'habito'

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'epic'

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado'

export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export interface Task {
  id: string
  daughterId: string
  title: string
  description?: string
  category: TaskCategory
  difficulty?: TaskDifficulty | null
  weekdays: Weekday[]
  startTime: string // e.g. "07:30"
  dueTime: string // e.g. "08:15"
  points: number
  status: TaskStatus
  completedAt?: string
  completedByDaughter?: boolean
  /** Data da ocorrência projetada (usada ao concluir/desfazer). */
  date?: string
  /** 'weekly' repete nos dias da semana; 'once' acontece só em scheduledDate. */
  repeat?: 'weekly' | 'once'
  scheduledDate?: string | null
}

export interface Daughter {
  id: string
  name: string
  age: number
  avatarUrl: string
  status: 'active' | 'paused'
  streakDays: number
  totalPoints: number
  completedTodayCount: number
  totalTodayCount: number
  schoolGrade: string
  birthdate?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'streak' | 'pontos' | 'disciplina' | 'especial'
  unlocked: boolean
  unlockedAt?: string
  currentProgress: number
  totalGoal: number
  rewardPoints: number
}

export interface NotificationRule {
  id: string
  enabled: boolean
  frequency: 'alta' | 'moderada' | 'suave'
  startTime: string // e.g. "07:00"
  endTime: string // e.g. "21:00"
  notifyMotherOnComplete: boolean
  notifyMotherOnDelay: boolean
  daughterReminderMinutesBefore: number
}

export interface NotificationItem {
  id: string
  recipient: 'daughter' | 'mother'
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'reminder' | 'congratulations' | 'alert' | 'streak'
}

export interface DailyReport {
  date: string
  dayName: string
  total: number
  completed: number
  rate: number // 0 - 100
}

export interface DashboardSummary {
  date: string
  daughter: {
    id: string
    name: string
    streakDays: number
    totalPoints: number
  }
  totals: {
    total: number
    completed: number
    pending: number
    inProgress: number
    late: number
    completionRate: number
  }
  pointsToday: number
  averageRate: number
  rateTrend: { value: number; positive: boolean }
  nextTask: Task | null
  recentCompleted: Task[]
  weeklySeries: DailyReport[]
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly'

export interface CategoryStat {
  key: TaskCategory
  completed: number
  total: number
  rate: number
}

export interface ReportStats {
  period: ReportPeriod
  range: { start: string; end: string }
  daughter: {
    id: string
    name: string
    streakDays: number
    totalPoints: number
  }
  summary: {
    rate: number
    punctuality: number
    points: number
    totalScheduled: number
    totalCompleted: number
    totalMissed: number
    rateTrend: { value: number; positive: boolean }
  }
  series: DailyReport[]
  categories: CategoryStat[]
}

export interface PointsGoal {
  points: number
  goal: number
  progress: number
}

export interface PointsSummary {
  total: number
  level: number
  nextLevelPoints: number
  levelProgress: number
  streakDays: number
  weekly: PointsGoal
  monthly: PointsGoal
}

export interface CompletionPoints {
  awarded: number
  base: number
  bonus: number
  breakdown: {
    punctuality: number
    early: number
    first_of_day: number
    late: boolean
  }
}

export type ViewportMode = 'mobile' | 'tablet' | 'desktop'

export type ActiveTabMother =
  'dashboard' | 'tasks' | 'daughters' | 'reports' | 'notifications'

export type ActiveTabDaughter = 'today' | 'progress' | 'achievements'

export type AppSection = 'app' | 'design_system' | 'ux_docs' | 'wireframes'
