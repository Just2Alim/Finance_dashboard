import { describe, expect, it } from 'vitest'
import { defaultBusiness, calculateBusiness, calculateScenarios, calculateInventory, getChannelMetrics, validateAiRequest } from '../src/domain.js'

describe('business calculations', () => {
  it('uses the supplied resale numbers and derives unit economics', () => {
    const result = calculateBusiness(defaultBusiness)
    expect(result.unitMargin).toBe(3525)
    expect(result.breakEvenUnits).toBe(39)
    expect(result.monthlyProfit).toBe(75475)
    expect(result.plannedCustomers).toBe(30)
    expect(result.targetCac).toBeCloseTo(294.12, 1)
  })

  it('returns safe values for missing or invalid margins', () => {
    const result = calculateBusiness({ ...defaultBusiness, price: 0, unitCost: 0, targetCustomers: 0 })
    expect(result.breakEvenUnits).toBeNull()
    expect(result.targetCac).toBeNull()
  })

  it('compares downside, base and upside sales scenarios', () => {
    const results = calculateScenarios(defaultBusiness)
    expect(results.map(item => item.sales)).toEqual([24, 60, 150])
    expect(results[1].profit).toBe(75475)
  })

  it('calculates landed cost, tied-up cash and reorder point for resale lots', () => {
    const result = calculateInventory([
      { quantity: 20, sold: 5, purchaseCost: 1000, deliveryCost: 200, packagingCost: 50, leadDays: 10, dailySales: 1, status: 'В пути' },
    ])
    expect(result.remainingUnits).toBe(15)
    expect(result.landedCostPerUnit).toBe(1250)
    expect(result.cashInStock).toBe(18750)
    expect(result.reorderPoint).toBe(10)
    expect(result.needsReorder).toBe(false)
    const lowStock = calculateInventory([{ quantity: 10, sold: 4, purchaseCost: 1, deliveryCost: 0, packagingCost: 0, leadDays: 10, dailySales: 1, status: 'На складе' }])
    expect(lowStock.needsReorder).toBe(true)
    expect(calculateInventory().landedCostPerUnit).toBeNull()
  })

  it('calculates channel funnel metrics and handles a zero conversion rate', () => {
    const metrics = getChannelMetrics({ reachPerDay: 50, conversionRate: 2, monthlyBudget: 10000 }, defaultBusiness)
    expect(metrics).toEqual({ contacts: 1500, customers: 30, cac: 10000 / 30, revenue: 180000 })
    expect(getChannelMetrics({ reachPerDay: 0, conversionRate: 0, monthlyBudget: 0 }, defaultBusiness).cac).toBeNull()
  })

  it('rejects oversized or malformed AI requests', () => {
    expect(validateAiRequest({ task: 'analyze', context: { price: 6000 } }).ok).toBe(true)
    expect(validateAiRequest({ task: '', context: {} }).ok).toBe(false)
    expect(validateAiRequest({ task: 'x'.repeat(5000), context: {} }).ok).toBe(false)
  })
})
