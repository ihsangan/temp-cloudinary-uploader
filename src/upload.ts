import { Hono, Context } from 'hono'
import uploadFile from './cloudinary'

const uploadApp = new Hono()

uploadApp.post('/', async (c: Context) => {
  const startTime = Date.now()
  const body: Record<string, any> = await c.req.parseBody()
  const file: File | null = body['file']
  
  if (!file || typeof file === 'string') {
    return c.json({ success: false, message: 'No file uploaded.' }, 400)
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
    const res = await uploadFile(file, startTime)
    let url = res.secure_url.replace(`v${res.version}/`, '')

    return c.json({
      url,
      processingTime: Date.now() - startTime
    }, 200)
  }
  catch (err) {
    console.error('Error uploading:', err)
    return c.json({ success: false, message: 'Failed to upload.' }, 500)
  }
})

export default uploadApp
