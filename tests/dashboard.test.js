const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function loadDashboardModel(setup = '') {
  const html = fs.readFileSync('index.html', 'utf8')
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/makeContent\(\);\s*$/, '')
  const sandbox = {
    console,
    structuredClone,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { addEventListener: () => {}, querySelector: () => ({}) },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout,
    URL,
    Blob,
  }
  const result = vm.runInNewContext(`${source}
    ${setup}
    JSON.stringify({
      state, margin: margin(), lifetime: life(), ltv: ltv(),
      allowedCAC: ltv() / 3, plannedCAC: targetCAC(),
      competitorCount: state.competitors.length,
      competitorMatrix: cStats().formats,
      salesAverage: state.salesAverage, salesLaunch: state.salesLaunch,
      salesBest: state.salesBest, capacity: state.capacity,
      channels: cResults().map(({ contacts, clients, cac }) => ({ contacts, clients, cac })),
      canvas: renderCanvas(),
    })`, sandbox)
  return JSON.parse(result)
}

test('loads the resale business and figures from dashboard.html', () => {
  const model = loadDashboardModel()
  assert.equal(model.state.projectType, 'goods')
  assert.match(model.state.product, /перепродаж/i)
  assert.equal(model.state.price, 6000)
  assert.equal(model.state.cost, 2235)
  assert.equal(model.state.tax, 4)
  assert.equal(model.state.marketing, 10000)
  assert.equal(model.state.target, 34)
  assert.equal(model.state.dailyReach, 50)
  assert.equal(model.state.conversion, 2)
  assert.equal(model.state.onlineSales, 30)
  assert.equal(model.salesAverage, 60)
  assert.equal(model.salesLaunch, 24)
  assert.equal(model.salesBest, 150)
  assert.equal(model.capacity, 200)
  assert.match(model.canvas, /Продажи: средний месяц/)
  assert.match(model.canvas, /Постоянные расходы OPEX/)
  assert.match(model.canvas, /Стартовые вложения CAPEX/)
})

test('does not present missing competitor research as verified facts', () => {
  const model = loadDashboardModel()
  assert.equal(model.competitorCount, 3)
  assert.ok(model.state.competitors.every(row => !row.verified))
  assert.ok(model.state.competitors.every(row => row.followers === 0))
})

test('does not carry 3D school control channels into the resale forecast', () => {
  const model = loadDashboardModel()
  assert.ok(model.state.channels.every(channel => !/школ|курс|урок|партнёрств/i.test(channel.name + channel.why)))
  assert.ok(model.state.channels.every(channel => !/контрольный пример|Claude-референс/i.test(channel.source)))
})

test('computes unit margin and CAC safely when customer frequency is unknown', () => {
  const model = loadDashboardModel()
  assert.equal(model.margin, 3525)
  assert.equal(model.lifetime, 1)
  assert.equal(model.ltv, 3525)
  assert.equal(model.allowedCAC, 1175)
  assert.ok(Number.isFinite(model.plannedCAC))
  assert.equal(Math.round(model.plannedCAC), 294)
  assert.ok(Math.abs(model.channels[0].contacts - 1500) < 0.01)
  assert.ok(Math.abs(model.channels[0].clients - 30) < 0.001)
  assert.ok(Math.abs(model.channels[0].cac - 10000 / 30) < 0.01)
})


test('groups competitor formats using unique competitors and average ER', () => {
  const fixture = `state.competitors = [
    ['A','Reels',70],['A','Пост со скидкой',8],['A','Карусель',30],
    ['B','Пост со скидкой',10],['B','Карусель',40],
    ['C','Пост со скидкой',6],['C','Карусель',35],['C','Сторис-опрос',10],
    ['D','Пост со скидкой',8],
  ].map(([name,format,reactions]) => ({name,url:'',channel:'Instagram',format,followers:1000,reactions,offer:'',date:'',verified:true,known:''}))`
  const model = loadDashboardModel(fixture)
  assert.ok(Math.abs(model.competitorMatrix.reduce((sum, item) => sum + item.er, 0) / 4 - 3.075) < 0.001)
  assert.deepEqual(model.competitorMatrix.map(item => [item.format, item.group]), [
    ['Reels', 'Взять и усилить'],
    ['Пост со скидкой', 'Не копировать'],
    ['Карусель', 'Делать, но иначе'],
    ['Сторис-опрос', 'Тестировать осторожно'],
  ])
})

test('keeps channel layouts inside the viewport at desktop and mobile sizes', () => {
  const html = fs.readFileSync('index.html', 'utf8')
  assert.match(html, /@media\(max-width:1400px\)\{\.channel\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/)
  assert.match(html, /@media\(max-width:700px\)[\s\S]*?\.channel\{grid-template-columns:1fr 1fr\}/)
  assert.match(html, /\.channel \.field,\.channel input,\.channel select,\.row3>\*\{min-width:0\}/)
})
