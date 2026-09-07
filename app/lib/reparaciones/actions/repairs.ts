'use server'

import { prisma } from '@/app/lib/prisma'
import { getSession } from '@/app/lib/auth/session'
import { isClosed } from '@/app/lib/reparaciones/status'
import { RepairStatus } from '@/app/generated/prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRepairAction(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const customerId = formData.get('customerId') as string
  const deviceBrand = formData.get('deviceBrand') as string
  const deviceModel = formData.get('deviceModel') as string
  const imei = (formData.get('imei') as string) || null
  const reportedProblem = formData.get('reportedProblem') as string
  const estimatedCost = Number(formData.get('estimatedCost') || 0)
  const technicianId = (formData.get('technicianId') as string) || null
  const estimatedAt = (formData.get('estimatedAt') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!customerId || !deviceBrand?.trim() || !deviceModel?.trim() || !reportedProblem?.trim()) {
    return { error: 'Cliente, marca, modelo y problema reportado son obligatorios.' }
  }

  if (isNaN(estimatedCost) || estimatedCost < 0) {
    return { error: 'El costo estimado debe ser un número válido.' }
  }

  let repairId: string
  try {
    const repair = await prisma.repair.create({
      data: {
        customerId,
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        imei: imei?.trim() || null,
        reportedProblem: reportedProblem.trim(),
        estimatedCost,
        technicianId: technicianId || null,
        estimatedAt: estimatedAt ? new Date(estimatedAt) : null,
        notes: notes?.trim() || null,
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: RepairStatus.RECIBIDO,
            userId: session.id,
            notes: 'Orden de reparación registrada.',
          },
        },
      },
    })
    repairId = repair.id
  } catch (error) {
    console.error(error)
    return { error: 'No se pudo registrar la orden de reparación.' }
  }

  revalidatePath('/reparaciones')
  revalidatePath(`/clientes/${customerId}`)
  redirect(`/reparaciones/${repairId}`)
}

export async function updateRepairStatusAction(repairId: string, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const newStatus = formData.get('status') as RepairStatus
  const notes = (formData.get('notes') as string) || null

  if (!newStatus || !Object.values(RepairStatus).includes(newStatus)) {
    return { error: 'Estado no válido.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const repair = await tx.repair.findUnique({
        where: { id: repairId },
        include: { usedParts: true },
      })
      if (!repair) throw new Error('Orden no encontrada')
      if (isClosed(repair.status)) throw new Error('La orden ya está cerrada')
      if (repair.status === newStatus) throw new Error('La orden ya está en ese estado')

      const partsTotal = repair.usedParts.reduce((acc, p) => acc + Number(p.subtotal), 0)

      await tx.repair.update({
        where: { id: repairId },
        data: {
          status: newStatus,
          deliveredAt: newStatus === RepairStatus.ENTREGADO ? new Date() : repair.deliveredAt,
          finalCost:
            newStatus === RepairStatus.ENTREGADO && repair.finalCost === null
              ? Number(repair.estimatedCost) + partsTotal
              : repair.finalCost,
        },
      })

      await tx.repairStatusHistory.create({
        data: {
          repairId,
          previousStatus: repair.status,
          newStatus,
          userId: session.id,
          notes: notes?.trim() || null,
        },
      })
    })
  } catch (error) {
    console.error(error)
    return { error: error instanceof Error ? error.message : 'No se pudo cambiar el estado.' }
  }

  revalidatePath('/reparaciones')
  revalidatePath(`/reparaciones/${repairId}`)
  return { success: true }
}

export async function updateRepairDetailsAction(repairId: string, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const diagnosis = (formData.get('diagnosis') as string) || null
  const workDone = (formData.get('workDone') as string) || null
  const technicianId = (formData.get('technicianId') as string) || null
  const estimatedAt = (formData.get('estimatedAt') as string) || null
  const notes = (formData.get('notes') as string) || null
  const rawFinalCost = formData.get('finalCost') as string
  const finalCost = rawFinalCost === '' || rawFinalCost === null ? null : Number(rawFinalCost)

  if (finalCost !== null && (isNaN(finalCost) || finalCost < 0)) {
    return { error: 'El costo final debe ser un número válido.' }
  }

  try {
    await prisma.repair.update({
      where: { id: repairId },
      data: {
        diagnosis: diagnosis?.trim() || null,
        workDone: workDone?.trim() || null,
        technicianId: technicianId || null,
        estimatedAt: estimatedAt ? new Date(estimatedAt) : null,
        notes: notes?.trim() || null,
        finalCost,
      },
    })
  } catch (error) {
    console.error(error)
    return { error: 'No se pudo actualizar la orden.' }
  }

  revalidatePath('/reparaciones')
  revalidatePath(`/reparaciones/${repairId}`)
  return { success: true }
}

/**
 * Agrega un repuesto a la orden. Queda pendiente (isConfirmed = false):
 * no descuenta inventario hasta que se confirme su instalación.
 */
export async function addRepairPartAction(repairId: string, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const productId = formData.get('productId') as string
  const quantity = Number(formData.get('quantity') || 0)

  if (!productId) return { error: 'Selecciona un repuesto.' }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: 'La cantidad debe ser un entero mayor que cero.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const repair = await tx.repair.findUnique({ where: { id: repairId } })
      if (!repair) throw new Error('Orden no encontrada')
      if (isClosed(repair.status)) throw new Error('La orden ya está cerrada')

      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error('Producto no encontrado')

      const unitPrice = Number(product.salePrice)

      await tx.repairPart.create({
        data: {
          repairId,
          productId,
          quantity,
          unitPrice,
          subtotal: unitPrice * quantity,
          isConfirmed: false,
        },
      })
    })
  } catch (error) {
    console.error(error)
    return { error: error instanceof Error ? error.message : 'No se pudo agregar el repuesto.' }
  }

  revalidatePath(`/reparaciones/${repairId}`)
  return { success: true }
}

/** Confirma la instalación del repuesto: descuenta stock y registra la salida. */
export async function confirmRepairPartAction(partId: string) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  let repairId = ''
  try {
    await prisma.$transaction(async (tx) => {
      const part = await tx.repairPart.findUnique({
        where: { id: partId },
        include: { repair: true, product: true },
      })
      if (!part) throw new Error('Repuesto no encontrado')
      if (part.isConfirmed) throw new Error('El repuesto ya fue confirmado')
      if (isClosed(part.repair.status)) throw new Error('La orden ya está cerrada')
      if (part.product.stock < part.quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${part.product.stock}`)
      }

      repairId = part.repairId

      await tx.repairPart.update({
        where: { id: partId },
        data: { isConfirmed: true },
      })

      await tx.product.update({
        where: { id: part.productId },
        data: { stock: { decrement: part.quantity } },
      })

      await tx.inventoryMovement.create({
        data: {
          productId: part.productId,
          quantity: part.quantity,
          type: 'SALIDA',
          reason: `Reparación #${part.repair.orderNumber}`,
          userId: session.id,
        },
      })
    })
  } catch (error) {
    console.error(error)
    return { error: error instanceof Error ? error.message : 'No se pudo confirmar el repuesto.' }
  }

  revalidatePath(`/reparaciones/${repairId}`)
  revalidatePath('/inventario')
  revalidatePath('/productos')
  return { success: true }
}

/** Quita el repuesto de la orden; si estaba confirmado devuelve el stock. */
export async function removeRepairPartAction(partId: string) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  let repairId = ''
  try {
    await prisma.$transaction(async (tx) => {
      const part = await tx.repairPart.findUnique({
        where: { id: partId },
        include: { repair: true },
      })
      if (!part) throw new Error('Repuesto no encontrado')
      if (isClosed(part.repair.status)) throw new Error('La orden ya está cerrada')

      repairId = part.repairId

      if (part.isConfirmed) {
        await tx.product.update({
          where: { id: part.productId },
          data: { stock: { increment: part.quantity } },
        })

        await tx.inventoryMovement.create({
          data: {
            productId: part.productId,
            quantity: part.quantity,
            type: 'ENTRADA',
            reason: `Devolución de repuesto — Reparación #${part.repair.orderNumber}`,
            userId: session.id,
          },
        })
      }

      await tx.repairPart.delete({ where: { id: partId } })
    })
  } catch (error) {
    console.error(error)
    return { error: error instanceof Error ? error.message : 'No se pudo quitar el repuesto.' }
  }

  revalidatePath(`/reparaciones/${repairId}`)
  revalidatePath('/inventario')
  revalidatePath('/productos')
  return { success: true }
}
