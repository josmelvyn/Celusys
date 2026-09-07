'use server'

import { prisma } from '@/app/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { signJWT } from './jwt'
import { setSessionCookie, removeSessionCookie } from './session'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, ingrese correo y contraseña.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.active) {
      return { error: 'Credenciales inválidas o usuario desactivado.' }
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return { error: 'Credenciales inválidas.' }
    }

    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    await setSessionCookie(token)
  } catch (err) {
    console.error('Error en loginAction:', err)
    return { error: 'Ocurrió un error inesperado en el servidor.' }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  await removeSessionCookie()
  redirect('/login')
}