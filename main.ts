import { Hono } from 'hono'
import uploadApp from './upload'
import indexHtml from './public/index.html' with { type: 'text' }

const PORT: number = Number(process.env.PORT) || 3300
const app = new Hono()
app.route('/upload', uploadApp)
app.get('/', (c) => {
  return c.html(indexHtml)
})

export default {
  fetch: app.fetch,
  port: PORT
}
