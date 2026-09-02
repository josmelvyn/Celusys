'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCustomerAction(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string
  const email = (formData.get('email') as string) || null
  const address = (formData.get('address') as string) || null

  if (!firstName || !lastName || !phone) {
    return { error: 'Nombre, apellido y teléfono son campos obligatorios.' }
  }

  try {
    await prisma.customer.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email?.trim().toLowerCase() || null,
        address: address?.trim() || null,
      },
    })

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return { error: 'El correo electrónico ingresado ya pertenece a otro cliente.' }
    }
    return { error: 'No se pudo registrar el cliente.' }
  }
}

export async function updateCustomerAction(id: string, formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string
  const email = (formData.get('email') as string) || null
  const address = (formData.get('address') as string) || null

  if (!firstName || !lastName || !phone) {
    return { error: 'Nombre, apellido y teléfono son campos obligatorios.' }
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email?.trim().toLowerCase() || null,
        address: address?.trim() || null,
      },
    })

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch {
    return { error: 'Error al actualizar la información del cliente.' }
  }
}

export async function toggleCustomerStatusAction(id: string, active: boolean) {
  try {
    await prisma.customer.update({
      where: { id },
      data: { active: !active },
    })

    revalidatePath('/clientes')
    return { success: true }
  } catch {
    return { error: 'No se pudo cambiar el estado del cliente.' }
  }
}