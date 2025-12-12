import { Hono } from 'hono'
import uploadFile from './cloudinary'

const uploadApp = new Hono()

uploadApp.post('/', async (c) => {
  const startTime = Date.now()
  const body: Record<string, any> = await c.req.parseBody()
  const file: File | null = body['file']
  const res: Res = {}
  
  if (!file || typeof file === 'string') {
    res.success = false
    res.message = 'No file uploaded.'
    res.processingTime = Date.now() - startTime
    return c.json(res, 400)
  }
  
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    res.success = false
    res.message =  'File is not an image or video.'
    res.processingTime = Date.now() - startTime
    return c.json(res, 415)
  }
  /* // CLOUDFLARE TURNSTILE VALIDATION
  const turnstileToken: string | undefined = body['cf-turnstile-response']
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return c.json({ success: false, message: 'CAPTCHA token is missing.' }, 400)
  }

  try {
    const formData: FormData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    formData.append('response', turnstileToken)

    const turnstileRes: Response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data: Record<string, any> = await turnstileRes.json()
    
    if (!data.success) {
      console.error('CAPTCHA verification failed:', data['error-codes'])
      return c.json({
        success: false,
        message: 'CAPTCHA verification failed.',
        errors: data['error-codes'],
      }, 403)
    }
  } catch (err) {
    console.error('Error verifying CAPTCHA:', err)
    return c.json({ success: false, message: 'Error verifying CAPTCHA.' }, 500)
  }
  */
  try {
    const apiRes = await uploadFile(file, startTime)
    const ver = `v${apiRes.version}/`
    const url = apiRes.secure_url.replace(ver, '')
    res.url = url
    
    if (apiRes.resource_type === 'image') {
      res.optimizedUrl.avif = apiRes.secure_url.replace(ver, 'q_auto,f_avif/')
      res.optimizedUrl.webp = apiRes.secure_url.replace(ver, 'q_auto,f_webp/')
      res.cacheUrl.wsrv = res.optimizedUrl.webp.replace('//', '//wsrv.nl/?url=')
      res.cacheUrl.wp = res.optimizedUrl.webp.replace('//', '//i3.wp.com/')
    }
    
    if (apiRes.resource_type === 'video' && apiRes.format !== 'webm') {
      res.optimizedUrl.webm = res.url.replace(apiRes.format, 'webm')
    }
    
    if (apiRes.resource_type === 'video' && apiRes.format === 'webm') {
      res.optimizedUrl.webm = res.url.replace(ver, 'q_auto/')
    }
    
    res.processingTime = Date.now() - startTime
    return c.json(res, 200)
  }
  catch (err) {
    console.error('Error uploading:', err)
    res.success = false
    res.message = 'Failed to upload.'
    res.processingTime = Date.now() - startTime
    return c.json(res, 500)
  }
})

interface Res {
  success: boolean
  url?: string
  optimizedUrl?: {
    avif?: string
    webm?: string
    webp?: string
  }
  message?: string
  cacheUrl?: {
    wsrv: string
    wp: string
  }
  processingTime: number
}

export default uploadApp