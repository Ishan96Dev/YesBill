// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Supabase Data Service
 * 
 * Centralized service for all Supabase database operations:
 * - Services CRUD
 * - Calendar confirmations
 * - Bills / monthly summaries
 * - Analytics / statistics
 * - Bill configs
 */

import { supabase } from '../lib/supabase'
import { ensureAuth } from '../lib/supabase'
import notificationService from './notificationService'

// Helper: get user ID synchronously from localStorage for READ operations.
// Set by useUser.js on every auth event and AuthCallback on login.
// No async, no getSession(), no navigator.locks — instant & reliable.
function getUserId() {
  const userId = localStorage.getItem('user_id')
  if (userId) return userId
  throw new Error('No active session. Please sign in again.')
}

// Helper: get user ID with auth validation for WRITE operations.
// Checks JWT validity and refreshes if expired before allowing writes.
async function getUserIdForWrite() {
  return ensureAuth()
}

// ─── Services ──────────────────────────────────────────────────

export const servicesService = {
  /** Get all services for current user */
  async getAll() {
    const userId = await getUserId()

    const { data, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /** Get active services only */
  async getActive() {
    const userId = await getUserId()

    const { data, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /** Create a new service */
  async create(serviceData) {
    const userId = await getUserIdForWrite()

    const { data, error } = await supabase
      .from('user_services')
      .insert({
        user_id: userId,
        name: serviceData.name,
        type: serviceData.type || 'daily',
        price: Math.round((parseFloat(serviceData.price) || 0) * 100) / 100,
        schedule: serviceData.schedule || 'morning',
        icon: serviceData.icon || 'package',
        notes: serviceData.notes || '',
        delivery_type: serviceData.delivery_type || 'home_delivery',
        billing_day: serviceData.billing_day || 1,
        billing_month: serviceData.billing_month || 1,
        auto_generate_bill: serviceData.auto_generate_bill ?? true,
        active: true,
        service_role: serviceData.service_role || 'consumer',
        start_date: serviceData.start_date || null,
        end_date: serviceData.end_date || null,
        client_name: serviceData.client_name || null,
        client_phone: serviceData.client_phone || null,
        client_email: serviceData.client_email || null,
        client_address: serviceData.client_address || null,
      })
      .select()
      .single()

    if (error) throw error

    // Notify user (non-critical — never blocks service creation)
    try {
      await notificationService.create(
        userId, 'service_created',
        'New Service Added',
        `"${serviceData.name}" has been set up in your account`,
        { path: '/services' }
      )
    } catch (e) { console.error('[notif] service_created failed:', e?.message ?? e) }

    return data
  },

  /** Update an existing service */
  async update(serviceId, updates) {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('user_services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error

    // Notify user (non-critical — never blocks update)
    try {
      await notificationService.create(
        userId, 'service_updated',
        'Service Updated',
        `\"${data?.name || 'Service'}\" details have been updated`,
        { path: '/services' }
      )
    } catch (e) { console.error('[notif] service_updated failed:', e?.message ?? e) }

    return data
  },

  /** Delete a service */
  async delete(serviceId) {
    const { error } = await supabase
      .from('user_services')
      .delete()
      .eq('id', serviceId)

    if (error) throw error
  },

  /** Toggle service active status */
  async toggleActive(serviceId, currentActive) {
    return this.update(serviceId, { active: !currentActive })
  },
}

// ─── Calendar / Confirmations ─────────────────────────────────

export const calendarService = {
  /** Get all confirmations for a specific month (YYYY-MM) */
  async getMonth(yearMonth) {
    const userId = await getUserId()

    // Parse year-month to get date range
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = `${yearMonth}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('service_confirmations')
      .select(`
        *,
        service:user_services(id, name, price, icon, type, schedule, service_role)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  /** Get confirmations for a specific day (YYYY-MM-DD) */
  async getDay(date) {
    const userId = await getUserId()

    const { data, error } = await supabase
      .from('service_confirmations')
      .select(`
        *,
        service:user_services(id, name, price, icon, type, schedule)
      `)
      .eq('user_id', userId)
      .eq('date', date)

    if (error) throw error
    return data || []
  },

  /** Update or create a confirmation for a service on a date */
  async upsertConfirmation(serviceId, date, status, customAmount = null) {
    const userId = await getUserIdForWrite()

    const { data, error } = await supabase
      .from('service_confirmations')
      .upsert(
        {
          user_id: userId,
          service_id: serviceId,
          date,
          status,
          custom_amount: customAmount,
        },
        { onConflict: 'user_id,service_id,date' }
      )
      .select(`
        *,
        service:user_services(id, name, price, icon, type, schedule)
      `)
      .single()

    if (error) throw error
    return data
  },

  /** Get month total from confirmations */
  async getMonthTotal(yearMonth) {
    const confirmations = await this.getMonth(yearMonth)
    let total = 0
    for (const conf of confirmations) {
      if (conf.status === 'delivered') {
        total += conf.custom_amount || conf.service?.price || 0
      }
    }
    return total
  },

  /** Get today's confirmations with services */
  async getToday() {
    const today = new Date().toISOString().split('T')[0]
    return this.getDay(today)
  },

  /** Get confirmations for a specific service for a month (YYYY-MM) */
  async getServiceMonth(serviceId, yearMonth) {
    const userId = await getUserId()

    // Parse year-month to get date range
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = `${yearMonth}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('service_confirmations')
      .select(`
        *,
        service:user_services(id, name, price, icon, type, schedule)
      `)
      .eq('user_id', userId)
      .eq('service_id', serviceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  /** Get monthly stats summary for all services (for overview dashboard) */
  async getServicesMonthSummary(yearMonth) {
    // Get all active services and their confirmations for the month
    const [services, confirmations] = await Promise.all([
      servicesService.getActive(),
      this.getMonth(yearMonth),
    ])

    // Parse yearMonth to get days in month
    const [year, month] = yearMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()

    // Calculate stats per service
    return services.map(service => {
      const serviceConfs = confirmations.filter(c => c.service_id === service.id)
      const delivered = serviceConfs.filter(c => c.status === 'delivered')
      const skipped = serviceConfs.filter(c => c.status === 'skipped')

      let monthTotal
      if (service.type === 'monthly') {
        // Monthly services are billed once — find the billing_day confirmation only
        const billingDate = `${year}-${String(month).padStart(2, '0')}-${String(service.billing_day || 1).padStart(2, '0')}`
        const billingConf = serviceConfs.find(c => c.date === billingDate && c.status === 'delivered')
        monthTotal = billingConf ? (billingConf.custom_amount || service.price || 0) : 0
      } else {
        monthTotal = delivered.reduce(
          (sum, c) => sum + (c.custom_amount || service.price || 0),
          0
        )
      }

      // Calculate status: green if >80% delivered, yellow if >50%, red otherwise
      const trackedDays = delivered.length + skipped.length
      const deliveryRate = trackedDays > 0 ? (delivered.length / trackedDays) * 100 : 0

      let status = 'pending' // No data
      if (trackedDays > 0) {
        if (deliveryRate >= 80) status = 'on-track'
        else if (deliveryRate >= 50) status = 'warning'
        else status = 'behind'
      }

      return {
        ...service,
        deliveredCount: delivered.length,
        skippedCount: skipped.length,
        trackedDays,
        daysInMonth,
        monthTotal,
        deliveryRate: Math.round(deliveryRate),
        status,
      }
    })
  },

  /** 
   * Get indexed confirmations for efficient lookup
   * Returns an object indexed by composite key (serviceId-date) for multi-service calendars
   * or by date for single-service calendars
   */
  async getMonthIndexed(yearMonth, serviceId = null) {
    const confirmations = serviceId
      ? await this.getServiceMonth(serviceId, yearMonth)
      : await this.getMonth(yearMonth);

    const indexed = {};

    for (const conf of confirmations) {
      // Use composite key for multi-service calendar, date-only key for single service
      const key = serviceId
        ? conf.date
        : `${conf.service_id}-${conf.date}`;
      indexed[key] = conf;
    }

    return indexed;
  },

  /**
   * Get indexed confirmations for a full year (for yearly service calendars)
   * Returns { "YYYY-MM-DD": confirmation }
   */
  async getYearIndexed(year, serviceId) {
    const userId = await getUserId()
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
      .from('service_confirmations')
      .select(`*, service:user_services(id, name, price, icon, type, schedule)`)
      .eq('user_id', userId)
      .eq('service_id', serviceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    const indexed = {}
    for (const conf of (data || [])) {
      indexed[conf.date] = conf
    }
    return indexed
  },

  /**
   * Refresh all calendar data after an update
   * This ensures all views stay in sync
   */
  async refreshCalendarData(yearMonth) {
    const [services, confirmations, summary] = await Promise.all([
      servicesService.getActive(),
      this.getMonth(yearMonth),
      this.getServicesMonthSummary(yearMonth),
    ]);

    // Index confirmations by composite key
    const indexed = {};
    for (const conf of confirmations) {
      const key = `${conf.service_id}-${conf.date}`;
      indexed[key] = conf;
    }

    return {
      services,
      confirmations,
      indexed,
      summary,
    };
  },
}

// ─── Bill Config ──────────────────────────────────────────────

export const billConfigService = {
  /** Get active bill config */
  async getActive() {
    const userId = await getUserId()

    const { data, error } = await supabase
      .from('bill_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /** Create a bill config */
  async create(configData) {
    const userId = await getUserId()

    const { data, error } = await supabase
      .from('bill_configs')
      .insert({
        user_id: userId,
        daily_amount: parseFloat(configData.daily_amount),
        currency: configData.currency || 'INR',
        start_date: configData.start_date || new Date().toISOString().split('T')[0],
        active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Update a bill config */
  async update(configId, updates) {
    const { data, error } = await supabase
      .from('bill_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ─── Analytics / Statistics ───────────────────────────────────

export const analyticsService = {
  /** Get dashboard stats (current month) */
  async getDashboardStats() {

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Fetch in parallel
    const [services, monthConfirmations, config] = await Promise.all([
      servicesService.getActive(),
      calendarService.getMonth(currentMonth),
      billConfigService.getActive(),
    ])

    const delivered = monthConfirmations.filter(c => c.status === 'delivered')
    const totalSpent = delivered.reduce((sum, c) => sum + (c.custom_amount || c.service?.price || 0), 0)
    const totalConfirmations = monthConfirmations.length
    const deliveryRate = totalConfirmations > 0 ? ((delivered.length / totalConfirmations) * 100) : 0

    // Role-based stats — build service_id → service_role lookup
    const serviceRoleMap = {}
    services.forEach(s => { serviceRoleMap[s.id] = s.service_role || 'consumer' })

    const consumerDelivered = delivered.filter(c => (serviceRoleMap[c.service_id] || 'consumer') === 'consumer')
    const providerDelivered = delivered.filter(c => serviceRoleMap[c.service_id] === 'provider')
    const consumerSpent = consumerDelivered.reduce((sum, c) => sum + (c.custom_amount || c.service?.price || 0), 0)
    const providerIncome = providerDelivered.reduce((sum, c) => sum + (c.custom_amount || c.service?.price || 0), 0)
    const hasProviderServices = services.some(s => s.service_role === 'provider')

    return {
      totalSpent,
      activeServicesCount: services.length,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      delivered: delivered.length,
      skipped: monthConfirmations.filter(c => c.status === 'skipped').length,
      totalConfirmations,
      currency: config?.currency || 'INR',
      services,
      currentMonth,
      consumerSpent,
      providerIncome,
      netBalance: providerIncome - consumerSpent,
      hasProviderServices,
    }
  },

  /** Get monthly spending data for analytics charts (last N months) */
  async getMonthlyTrend(months = 6, role = 'all') {

    const result = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthName = d.toLocaleDateString('en-US', { month: 'short' })

      try {
        const confirmations = await calendarService.getMonth(yearMonth)
        const roleMatch = c => role === 'all' || (c.service?.service_role || 'consumer') === role
        const delivered = confirmations.filter(c => c.status === 'delivered' && roleMatch(c))
        const skipped = confirmations.filter(c => c.status === 'skipped' && roleMatch(c))
        const total = delivered.reduce((sum, c) => sum + (c.custom_amount || c.service?.price || 0), 0)
        const totalConf = delivered.length + skipped.length

        result.push({
          month: monthName,
          yearMonth,
          amount: total,
          delivered: totalConf > 0 ? Math.round((delivered.length / totalConf) * 100) : 0,
          skipped: totalConf > 0 ? Math.round((skipped.length / totalConf) * 100) : 0,
          deliveredCount: delivered.length,
          skippedCount: skipped.length,
        })
      } catch (err) {
        console.warn(`Failed to get data for ${yearMonth}:`, err.message)
        result.push({ month: monthName, yearMonth, amount: 0, delivered: 0, skipped: 0, deliveredCount: 0, skippedCount: 0 })
      }
    }

    return result
  },

  /** Get service breakdown for analytics */
  async getServiceBreakdown(yearMonth, role = 'all') {
    if (!yearMonth) {
      const now = new Date()
      yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    const confirmations = await calendarService.getMonth(yearMonth)
    const delivered = confirmations.filter(c =>
      c.status === 'delivered' &&
      (role === 'all' || (c.service?.service_role || 'consumer') === role)
    )

    // Group by service
    const byService = {}
    for (const conf of delivered) {
      const serviceName = conf.service?.name || 'Unknown'
      if (!byService[serviceName]) {
        byService[serviceName] = { name: serviceName, amount: 0, count: 0 }
      }
      byService[serviceName].amount += (conf.custom_amount || conf.service?.price || 0)
      byService[serviceName].count += 1
    }

    const breakdown = Object.values(byService).sort((a, b) => b.amount - a.amount)
    const grandTotal = breakdown.reduce((sum, s) => sum + s.amount, 0)

    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']
    return breakdown.map((s, i) => ({
      ...s,
      percentage: grandTotal > 0 ? Math.round((s.amount / grandTotal) * 100) : 0,
      color: colors[i % colors.length],
    }))
  },

  /** Per-service monthly breakdown for stacked bar chart */
  async getPerServiceMonthlyData(months = 6, role = 'all') {
    const now = new Date()
    const allServices = await servicesService.getActive()
    const filteredServices = role === 'all'
      ? allServices
      : allServices.filter(s => (s.service_role || 'consumer') === role)
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-yellow-500', 'bg-red-500']
    const serviceColorMap = {}
    filteredServices.forEach((svc, i) => { serviceColorMap[svc.id] = colors[i % colors.length] })
    const filteredServiceIds = new Set(filteredServices.map(s => s.id))

    const monthPromises = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthName = d.toLocaleDateString('en-US', { month: 'short' })
      return calendarService.getMonth(yearMonth).then(confs => {
        const delivered = confs.filter(c => c.status === 'delivered' && filteredServiceIds.has(c.service_id))
        const byService = {}
        for (const conf of delivered) {
          const sid = conf.service_id
          if (!byService[sid]) byService[sid] = { name: conf.service?.name || '', amount: 0, color: serviceColorMap[sid] || 'bg-gray-400' }
          byService[sid].amount += conf.custom_amount || conf.service?.price || 0
        }
        const total = Object.values(byService).reduce((s, v) => s + v.amount, 0)
        return { month: monthName, yearMonth, services: byService, total }
      }).catch(() => ({ month: monthName, yearMonth, services: {}, total: 0 }))
    })
    return Promise.all(monthPromises)
  },

  /** Spending grouped by delivery_type category */
  async getCategoryBreakdown(months = 6, role = 'all') {
    const [allServices, trend] = await Promise.all([
      servicesService.getActive(),
      this.getMonthlyTrend(months, role),
    ])
    const svcMap = {}
    for (const svc of allServices) svcMap[svc.id] = svc

    const now = new Date()
    const monthPromises = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return calendarService.getMonth(yearMonth).then(confs => confs.filter(c => c.status === 'delivered')).catch(() => [])
    })
    const allDeliveredByMonth = await Promise.all(monthPromises)
    const allDelivered = allDeliveredByMonth.flat().filter(conf =>
      role === 'all' || (svcMap[conf.service_id]?.service_role || 'consumer') === role
    )

    const catConfig = {
      home_delivery: { label: 'Home Delivery', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
      utility: { label: 'Utility', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
      visit_based: { label: 'Visit-Based', color: 'bg-green-500', gradient: 'from-green-500 to-emerald-600' },
      subscription: { label: 'Subscription', color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-600' },
      payment: { label: 'EMI / Loan', color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-600' },
    }
    const totals = {}
    for (const conf of allDelivered) {
      const svc = svcMap[conf.service_id] || {}
      const cat = svc.delivery_type || 'home_delivery'
      totals[cat] = (totals[cat] || 0) + (conf.custom_amount || conf.service?.price || svc.price || 0)
    }
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)
    return Object.entries(catConfig).map(([cat, cfg]) => ({
      category: cat,
      label: cfg.label,
      color: cfg.color,
      gradient: cfg.gradient,
      amount: Math.round((totals[cat] || 0) * 100) / 100,
      percentage: grandTotal > 0 ? Math.round(((totals[cat] || 0) / grandTotal) * 100) : 0,
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)
  },

  /** Fetch all generated bills for bill history chart */
  async getBillHistory() {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('generated_bills')
      .select('id, bill_title, total_amount, year_month, created_at')
      .eq('user_id', userId)
      .order('year_month', { ascending: true })
    if (error) throw error
    return (data || []).map(bill => ({
      id: bill.id,
      title: bill.bill_title || bill.year_month,
      amount: bill.total_amount || 0,
      yearMonth: bill.year_month,
      month: new Date((bill.year_month || '2026-01') + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      createdAt: bill.created_at,
    }))
  },

  /** Jan–Dec comparison across multiple years */
  async getYearlyComparison(years = [2025, 2026]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const allPromises = years.flatMap(yr =>
      Array.from({ length: 12 }, (_, m) => {
        const ym = `${yr}-${String(m + 1).padStart(2, '0')}`
        return calendarService.getMonth(ym).then(confs => {
          const total = confs.filter(c => c.status === 'delivered').reduce((s, c) => s + (c.custom_amount || c.service?.price || 0), 0)
          return { yr, m, total }
        }).catch(() => ({ yr, m, total: 0 }))
      })
    )
    const results = await Promise.all(allPromises)
    const data = {}
    for (const yr of years) {
      data[yr] = Array(12).fill(0)
    }
    for (const { yr, m, total } of results) {
      data[yr][m] = Math.round(total * 100) / 100
    }
    return { months, years: data }
  },

  /** Savings from skipped deliveries */
  async getSavingsData(months = 6, role = 'all') {
    const now = new Date()
    const monthPromises = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthName = d.toLocaleDateString('en-US', { month: 'short' })
      return calendarService.getMonth(yearMonth).then(confs => {
        const roleMatch = c => role === 'all' || (c.service?.service_role || 'consumer') === role
        const delivered = confs.filter(c => c.status === 'delivered' && roleMatch(c))
        const skipped = confs.filter(c => c.status === 'skipped' && roleMatch(c))
        const actual = delivered.reduce((s, c) => s + (c.custom_amount || c.service?.price || 0), 0)
        const savings = skipped.reduce((s, c) => s + (c.service?.price || 0), 0)
        return { month: monthName, yearMonth, actual: Math.round(actual * 100) / 100, savings: Math.round(savings * 100) / 100, potential: Math.round((actual + savings) * 100) / 100 }
      }).catch(() => ({ month: monthName, yearMonth, actual: 0, savings: 0, potential: 0 }))
    })
    return Promise.all(monthPromises)
  },

  /** Consecutive delivery streaks per service */
  async getStreakData(role = 'all') {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('service_confirmations')
      .select('service_id, date, status, service:user_services(id, name, icon, service_role)')
      .eq('user_id', userId)
      .eq('status', 'delivered')
      .order('service_id', { ascending: true })
      .order('date', { ascending: true })
    if (error) throw error

    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
    const byService = {}
    for (const conf of (data || [])) {
      if (role !== 'all' && (conf.service?.service_role || 'consumer') !== role) continue
      if (!byService[conf.service_id]) byService[conf.service_id] = { svc: conf.service, dates: [] }
      byService[conf.service_id].dates.push(conf.date)
    }

    const today = new Date().toISOString().split('T')[0]
    return Object.entries(byService).map(([sid, { svc, dates }], i) => {
      let longest = 1, current = 1
      for (let j = 1; j < dates.length; j++) {
        const prev = new Date(dates[j - 1]), curr = new Date(dates[j])
        const diff = (curr - prev) / 86400000
        if (diff === 1) { current++; longest = Math.max(longest, current) }
        else current = 1
      }
      // Current streak: count backwards from today
      let currentStreak = 0
      const sortedDesc = [...dates].sort((a, b) => b.localeCompare(a))
      let expected = today
      for (const d of sortedDesc) {
        if (d === expected) { currentStreak++; const dt = new Date(expected); dt.setDate(dt.getDate() - 1); expected = dt.toISOString().split('T')[0] }
        else break
      }
      return { serviceId: sid, name: svc?.name || 'Unknown', icon: svc?.icon || 'package', currentStreak, longestStreak: Math.max(longest, dates.length > 0 ? 1 : 0), totalDelivered: dates.length, color: colors[i % colors.length] }
    }).sort((a, b) => b.longestStreak - a.longestStreak)
  },

  /** Year-to-date service breakdown */
  async getServiceBreakdownYTD(role = 'all') {
    const now = new Date()
    const year = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const monthPromises = Array.from({ length: currentMonth }, (_, i) => {
      const ym = `${year}-${String(i + 1).padStart(2, '0')}`
      return this.getServiceBreakdown(ym, role).catch(() => [])
    })
    const allMonths = await Promise.all(monthPromises)
    const aggregate = {}
    for (const month of allMonths) {
      for (const svc of month) {
        if (!aggregate[svc.name]) aggregate[svc.name] = { name: svc.name, amount: 0, color: svc.color }
        aggregate[svc.name].amount += svc.amount
      }
    }
    const result = Object.values(aggregate).sort((a, b) => b.amount - a.amount)
    const grandTotal = result.reduce((s, v) => s + v.amount, 0)
    return result.map(s => ({ ...s, percentage: grandTotal > 0 ? Math.round((s.amount / grandTotal) * 100) : 0 }))
  },

  /** Get overall user statistics */
  async getUserStats() {
    const userId = await getUserId()

    try {
      const { data, error } = await supabase.rpc('get_user_statistics', { p_user_id: userId })
      if (error) throw error
      return data?.[0] || null
    } catch {
      // Fallback if function doesn't exist
      return null
    }
  },
}

// ─── Bills ────────────────────────────────────────────────────

export const billsService = {
  /** Generate a bill for a given month from calendar data */
  async generateBill(yearMonth) {
    const [confirmations, services, config] = await Promise.all([
      calendarService.getMonth(yearMonth),
      servicesService.getActive(),
      billConfigService.getActive(),
    ])

    const [year, month] = yearMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    // Build items by service
    const items = services.map(service => {
      const serviceConfs = confirmations.filter(c => c.service_id === service.id)
      const delivered = serviceConfs.filter(c => c.status === 'delivered')
      const skipped = serviceConfs.filter(c => c.status === 'skipped')
      const serviceTotal = delivered.reduce((sum, c) => sum + (c.custom_amount || service.price || 0), 0)

      return {
        service: service.name,
        icon: service.icon,
        daysDelivered: delivered.length,
        daysSkipped: skipped.length,
        ratePerDay: service.price,
        total: serviceTotal,
        notes: skipped.length > 0
          ? `Skipped on ${skipped.length} day(s)`
          : 'Delivered consistently',
      }
    })

    const total = items.reduce((sum, i) => sum + i.total, 0)
    const totalDelivered = items.reduce((sum, i) => sum + i.daysDelivered, 0)
    const totalPossible = items.reduce((sum, i) => sum + i.daysDelivered + i.daysSkipped, 0)
    const deliveryRate = totalPossible > 0 ? Math.round((totalDelivered / totalPossible) * 100 * 10) / 10 : 0
    const topService = items.sort((a, b) => b.total - a.total)[0]

    return {
      month: monthName,
      yearMonth,
      generatedAt: new Date().toISOString(),
      total,
      subtotal: total,
      currency: config?.currency || 'INR',
      items: items.sort((a, b) => b.total - a.total),
      insights: {
        totalDays: daysInMonth,
        servicesTracked: services.length,
        deliveryRate,
        savings: 0, // Could calculate based on skips
        topService: topService?.service || 'N/A',
      },
      aiSummary: `Your ${monthName} billing shows ${services.length} tracked service(s) with a ${deliveryRate}% delivery rate. ${topService ? `${topService.service} is your top expense at ₹${topService.total.toFixed(0)}.` : ''} Total for the month: ₹${total.toFixed(2)}.`,
    }
  },
}

export default {
  services: servicesService,
  calendar: calendarService,
  billConfig: billConfigService,
  analytics: analyticsService,
  bills: billsService,
}
