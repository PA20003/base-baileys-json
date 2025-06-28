const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require('@bot-whatsapp/bot')

const qrcode = require('qrcode-terminal') // ✅ Mostrar QR en consola
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

/***
 * Simular petición HTTP falsa con 1.5s de retraso
 */
const fakeHTTPMenu = async () => {
  console.log('⚡ Server request!')
  await delay(1500)
  console.log('⚡ Server return!')
  return Promise.resolve([{ body: 'Arepas' }, { body: 'Empanadas' }])
}

/***
 * Simular petición HTTP para pago online con 0.5s de retraso
 */
const fakeHTTPPayment = async () => {
  const link = `https://www.buymeacoffee.com/leifermendez?t=${Date.now()}`
  console.log('⚡ Server request!')
  await delay(500)
  console.log('⚡ Server return!')
  return Promise.resolve([
    { body: `Puedes hacer un *pago* en el siguiente link: ${link}` },
  ])
}

const flujoCash = addKeyword('efectivo').addAnswer(
  'Ok te espero con los billetes'
)

const flujosOnline = addKeyword('online').addAnswer(
  ['Te envío el link'],
  null,
  async (_, { flowDynamic }) => {
    const link = await fakeHTTPPayment()
    return flowDynamic(link)
  }
)

const flujoPedido = addKeyword(['pedido', 'pedir']).addAnswer(
  '¿Cómo quieres pagar: en *efectivo* o *online*?',
  null,
  null,
  [flujoCash, flujosOnline]
)

const conversacionPrincipal = addKeyword(['hola', 'ole', 'buenas'])
  .addAnswer('Bienvenido al restaurante *La cuchara de palo 🙌*')
  .addAnswer(
    'El menú del día es el siguiente:',
    null,
    async (_, { flowDynamic }) => {
      const menu = await fakeHTTPMenu()
      return flowDynamic(menu)
    }
  )
  .addAnswer('👉 Si deseas ordenar escribe *pedir*', { delay: 1500 }, null, [
    flujoPedido,
  ])

const main = async () => {
  const adapterDB = new MockAdapter()
  const adapterFlow = createFlow([conversacionPrincipal])
  const adapterProvider = createProvider(BaileysProvider)

  // ✅ Mostrar QR en consola + diagnóstico
  adapterProvider.on('qr', (qr) => {
    console.log('[QR EVENTO RECIBIDO]')
    qrcode.generate(qr, { small: true })
  })

  adapterProvider.on('ready', () => {
    console.log('[BOT CONECTADO A WHATSAPP]')
  })

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })
}

main()


