import type {
  Achievement,
  AuthUser,
  CompletionPoints,
  Daughter,
  DashboardSummary,
  NotificationItem,
  NotificationRule,
  PointsSummary,
  ReportPeriod,
  ReportStats,
  Task,
  TaskCategory,
  TaskDifficulty,
  Weekday,
} from '#/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const PREFIX = `${API_BASE}/api/v1`

export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[] | undefined>

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[] | undefined>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0]
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const hasBody = options.body !== undefined

  const response = await fetch(`${PREFIX}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mr:unauthorized'))
    }
    throw new ApiError('Sessão expirada. Entre novamente.', 401)
  }

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const data = payload as {
      message?: string
      errors?: Record<string, string[] | undefined>
    } | null
    const errors = data?.errors
    const firstError = errors?.[Object.keys(errors)[0] ?? '']?.[0]
    const message =
      data?.message ??
      errors?.email?.[0] ??
      firstError ??
      `Erro ${response.status} ao comunicar com a API.`

    throw new ApiError(message, response.status, data?.errors)
  }

  return payload as T
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, value)
  })
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

export type TaskPayload = {
  daughterId: string
  title: string
  description?: string
  category: TaskCategory
  difficulty?: TaskDifficulty | null
  weekdays: Weekday[]
  /** Preenchido apenas para tarefas de data única (não repetem). */
  date?: string | null
  startTime: string
  dueTime: string
  points: number
}

export type DaughterPayload = {
  name: string
  email: string
  password: string
  birthdate?: string
  schoolGrade?: string
  avatarUrl?: string
}

function toTaskRequest(payload: TaskPayload) {
  return {
    daughter_id: payload.daughterId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    difficulty: payload.difficulty ?? null,
    weekdays: payload.weekdays,
    date: payload.date ?? null,
    start_time: payload.startTime,
    due_time: payload.dueTime,
    points: payload.points,
  }
}

function toDaughterRequest(payload: Partial<DaughterPayload>) {
  return {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    birthdate: payload.birthdate,
    school_grade: payload.schoolGrade,
    avatar_url: payload.avatarUrl,
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
    family_name?: string
  }) =>
    request<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: payload,
    }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: (payload: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: payload,
    }),
}

export const daughtersApi = {
  list: () => request<{ data: Daughter[] }>('/daughters').then((r) => r.data),
  create: (payload: DaughterPayload) =>
    request<{ data: Daughter }>('/daughters', {
      method: 'POST',
      body: toDaughterRequest(payload),
    }).then((r) => r.data),
  update: (id: string, payload: Partial<DaughterPayload>) =>
    request<{ data: Daughter }>(`/daughters/${id}`, {
      method: 'PUT',
      body: toDaughterRequest(payload),
    }).then((r) => r.data),
  updateStatus: (id: string, status: 'active' | 'paused') =>
    request<{ data: Daughter }>(`/daughters/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }).then((r) => r.data),
}

export const tasksApi = {
  list: (
    filters: {
      daughterId?: string
      weekday?: string
      status?: string
      search?: string
    } = {},
  ) => request<{ data: Task[] }>(`/tasks${query(filters)}`).then((r) => r.data),
  agenda: (date?: string) =>
    request<{ date: string; data: Task[] }>(`/agenda${query({ date })}`).then(
      (r) => r.data,
    ),
  create: (payload: TaskPayload) =>
    request<{ data: Task }>('/tasks', {
      method: 'POST',
      body: toTaskRequest(payload),
    }).then((r) => r.data),
  update: (id: string, payload: TaskPayload) =>
    request<{ data: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: toTaskRequest(payload),
    }).then((r) => r.data),
  remove: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) =>
    request<{ data: Task }>(`/tasks/${id}/duplicate`, { method: 'POST' }).then(
      (r) => r.data,
    ),
  complete: (id: string, date?: string) =>
    request<{ data: Task; points: CompletionPoints }>(
      `/tasks/${id}/completion`,
      {
        method: 'POST',
        body: date ? { date } : {},
      },
    ),
  uncomplete: (id: string, date?: string) =>
    request<{ data: Task }>(`/tasks/${id}/completion`, {
      method: 'DELETE',
      body: date ? { date } : {},
    }).then((r) => r.data),
}

export const dashboardApi = {
  summary: (params: { daughterId?: string; date?: string } = {}) =>
    request<DashboardSummary>(
      `/dashboard/summary${query({ daughter_id: params.daughterId, date: params.date })}`,
    ),
}

export const reportsApi = {
  get: (period: ReportPeriod, daughterId?: string) =>
    request<ReportStats>(
      `/reports${query({ period, daughter_id: daughterId })}`,
    ),
}

export const achievementsApi = {
  list: (daughterId?: string) =>
    request<{ data: Achievement[]; points: PointsSummary }>(
      `/achievements${query({ daughter_id: daughterId })}`,
    ),
}

export const notificationsApi = {
  list: () =>
    request<{ data: NotificationItem[] }>('/notifications').then((r) => r.data),
  markRead: (id: string) =>
    request<{ data: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }).then((r) => r.data),
  markAllRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'POST' }),
  sendTest: (payload: {
    title: string
    message: string
    recipient?: string
    daughterId?: string
  }) =>
    request<{ data: NotificationItem }>('/notifications/test', {
      method: 'POST',
      body: payload,
    }).then((r) => r.data),
}

export const notificationRulesApi = {
  show: () =>
    request<{ data: NotificationRule }>('/notification-rules').then(
      (r) => r.data,
    ),
  update: (rule: NotificationRule) =>
    request<{ data: NotificationRule }>('/notification-rules', {
      method: 'PUT',
      body: {
        enabled: rule.enabled,
        frequency: rule.frequency,
        startTime: rule.startTime,
        endTime: rule.endTime,
        notifyMotherOnComplete: rule.notifyMotherOnComplete,
        notifyMotherOnDelay: rule.notifyMotherOnDelay,
        daughterReminderMinutesBefore: rule.daughterReminderMinutesBefore,
      },
    }).then((r) => r.data),
}

export { API_BASE, PREFIX }
