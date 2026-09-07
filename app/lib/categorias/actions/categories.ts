'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCategoryAction(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name || name.trim().length === 0) {
    return { error: 'El nombre de la categoría es obligatorio.' }
  }

  try {
    await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })
    revalidatePath('/categorias')
    return { success: true }
  } catch {
    return { error: 'Ya existe una categoría con ese nombre.' }
  }
}

export async function toggleCategoryStatusAction(id: string, active: boolean) {
  try {
    await prisma.category.update({
      where: { id },
      data: { active: !active },
    })
    revalidatePath('/categorias')
    return { success: true }
  } catch {
    return { error: 'No se pudo cambiar el estado de la categoría.' }
  }
}