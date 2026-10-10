import 'dotenv/config'
import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PASSWORD: z.string(),
  DB_USER: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`)
}

export const env = parsed.data