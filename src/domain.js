export const defaultBusiness = Object.freeze({
  projectName: 'Ресел бизнес',
  product: 'Товары для перепродажи · категория уточняется',
  source: 'Pinduoduo',
  price: 6000,
  unitCost: 2235,
  purchaseCost: 1215,
  deliveryCost: 700,
  packagingCost: 200,
  damageCost: 120,
  taxRate: 4,
  monthlyMarketing: 10000,
  monthlyOpex: 136025,
  startupInvestment: 141500,
  launchSales: 24,
  averageSales: 60,
  bestSales: 150,
  capacity: 200,
  dailyReach: 50,
  conversionRate: 2,
  repeatRate: 0,
  targetCustomers: 34,
  audience: 'Покупатели, которым важны цена и доступность товара',
  goal90: 'Проверить спрос, положительную экономику и повторяемость продаж',
  channels: [
    { name: 'Социальные сети · платное продвижение', monthlyBudget: 10000, reachPerDay: 50, conversionRate: 2, status: 'Ориентир из модели', note: 'Проверить фактический охват и стоимость заказа' },
    { name: 'Маркетплейсы', monthlyBudget: 0, reachPerDay: 0, conversionRate: 0, status: 'Заполнить после теста', note: '' },
    { name: 'Рекомендации и повторные продажи', monthlyBudget: 0, reachPerDay: 0, conversionRate: 0, status: 'Заполнить после теста', note: '' },
  ],
  competitors: [
    { name: 'Конкурент A', channel: '', price: 0, followers: 0, format: '', verified: false, notes: '' },
    { name: 'Конкурент B', channel: '', price: 0, followers: 0, format: '', verified: false, notes: '' },
    { name: 'Конкурент C', channel: '', price: 0, followers: 0, format: '', verified: false, notes: '' },
  ],
  experiments: [],
  actuals: { sales: 0, revenue: 0, adSpend: 0, period: new Date().toISOString().slice(0, 7) },
  scenarios: { downside: 24, base: 60, upside: 150 },
})

export function calculateBusiness(data) {
  const unitMargin = Number(data.price) * (1 - Number(data.taxRate) / 100) - Number(data.unitCost)
  const fixedCosts = Number(data.monthlyOpex)
  const breakEvenUnits = unitMargin > 0 ? Math.ceil(fixedCosts / unitMargin) : null
  const monthlyProfit = unitMargin * Number(data.averageSales) - fixedCosts
  const plannedCustomers = Number(data.dailyReach) * 30 * Number(data.conversionRate) / 100
  const targetCac = Number(data.targetCustomers) > 0 ? Number(data.monthlyMarketing) / Number(data.targetCustomers) : null
  return { unitMargin, fixedCosts, breakEvenUnits, monthlyProfit, plannedCustomers, targetCac, marginRate: Number(data.price) > 0 ? unitMargin / Number(data.price) : 0 }
}

export function calculateScenarios(data) {
  const unitMargin = calculateBusiness(data).unitMargin
  const fixedCosts = Number(data.monthlyOpex)
  return [
    { key: 'downside', label: 'Старт', sales: Number(data.launchSales), profit: unitMargin * Number(data.launchSales) - fixedCosts },
    { key: 'base', label: 'Средний месяц', sales: Number(data.averageSales), profit: unitMargin * Number(data.averageSales) - fixedCosts },
    { key: 'upside', label: 'Лучший месяц', sales: Number(data.bestSales), profit: unitMargin * Number(data.bestSales) - fixedCosts },
  ]
}

export function getChannelMetrics(channel, data) {
  const contacts = Number(channel.reachPerDay) * 30
  const customers = contacts * Number(channel.conversionRate) / 100
  const cac = customers > 0 ? Number(channel.monthlyBudget) / customers : null
  return { contacts, customers, cac, revenue: customers * Number(data.price) }
}

export function calculateInventory(lots = []) {
  const validLots = Array.isArray(lots) ? lots : []
  const remainingUnits = validLots.reduce((total, lot) => total + Math.max(0, Number(lot.quantity) - Number(lot.sold)), 0)
  const remainingInvestment = validLots.reduce((total, lot) => {
    const remaining = Math.max(0, Number(lot.quantity) - Number(lot.sold))
    return total + remaining * (Number(lot.purchaseCost) + Number(lot.deliveryCost) + Number(lot.packagingCost))
  }, 0)
  const purchasedUnits = validLots.reduce((total, lot) => total + Math.max(0, Number(lot.quantity)), 0)
  const totalLandedCost = validLots.reduce((total, lot) => total + Math.max(0, Number(lot.quantity)) * (Number(lot.purchaseCost) + Number(lot.deliveryCost) + Number(lot.packagingCost)), 0)
  const landedCostPerUnit = purchasedUnits ? totalLandedCost / purchasedUnits : null
  const avgDailySales = validLots.length ? validLots.reduce((total, lot) => total + Math.max(0, Number(lot.dailySales)), 0) / validLots.length : 0
  const leadDays = validLots.length ? Math.max(...validLots.map(lot => Math.max(0, Number(lot.leadDays)))) : 0
  const reorderPoint = Math.ceil(avgDailySales * leadDays)
  const inTransitUnits = validLots.filter(lot => lot.status === 'В пути').reduce((total, lot) => total + Math.max(0, Number(lot.quantity) - Number(lot.sold)), 0)
  return { remainingUnits, remainingInvestment, cashInStock: remainingInvestment, landedCostPerUnit, avgDailySales, leadDays, reorderPoint, inTransitUnits, needsReorder: avgDailySales > 0 && remainingUnits <= reorderPoint }
}

export function validateAiRequest(payload) {
  if (!payload || typeof payload.task !== 'string' || payload.task.trim().length < 2 || payload.task.length > 1200) return { ok: false }
  if (!payload.context || typeof payload.context !== 'object' || Array.isArray(payload.context)) return { ok: false }
  if (JSON.stringify(payload.context).length > 12000) return { ok: false }
  return { ok: true }
}

