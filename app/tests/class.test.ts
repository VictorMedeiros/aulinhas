import { PrismaClient } from '@prisma/client'
import { beforeEach, describe, expect, it, afterEach } from 'vitest'

const prisma = new PrismaClient()

describe('Class Model', () => {
  let testStudent: any

  beforeEach(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test Teacher'
      }
    })

    // Create a test student
    testStudent = await prisma.student.create({
      data: {
        name: 'Test Student',
        lessonRate: 50,
        userId: testUser.id
      }
    })
  })

  it('should create a class with payment status', async () => {
    const newClass = await prisma.class.create({
      data: {
        studentId: testStudent.id,
        date: new Date(),
        lessonRate: 50,
        paymentStatus: 'PENDING'
      }
    })

    expect(newClass).toBeDefined()
    expect(newClass.paymentStatus).toBe('PENDING')
    expect(newClass.paymentDate).toBeNull()
  })

  it('should update payment status to PAID', async () => {
    // Create a class first
    const newClass = await prisma.class.create({
      data: {
        studentId: testStudent.id,
        date: new Date(),
        lessonRate: 50,
        paymentStatus: 'PENDING'
      }
    })

    // Update the payment status
    const updatedClass = await prisma.class.update({
      where: { id: newClass.id },
      data: {
        paymentStatus: 'PAID',
        paymentDate: new Date()
      }
    })

    expect(updatedClass.paymentStatus).toBe('PAID')
    expect(updatedClass.paymentDate).toBeDefined()
  })

  it('should handle LATE payment status', async () => {
    const newClass = await prisma.class.create({
      data: {
        studentId: testStudent.id,
        date: new Date(),
        lessonRate: 50,
        paymentStatus: 'LATE'
      }
    })

    expect(newClass.paymentStatus).toBe('LATE')
  })

  it('should get all classes with specific payment status', async () => {
    // Create multiple classes
    await Promise.all([
      prisma.class.create({
        data: {
          studentId: testStudent.id,
          date: new Date(),
          lessonRate: 50,
          paymentStatus: 'PAID'
        }
      }),
      prisma.class.create({
        data: {
          studentId: testStudent.id,
          date: new Date(),
          lessonRate: 50,
          paymentStatus: 'PENDING'
        }
      })
    ])

    const pendingClasses = await prisma.class.findMany({
      where: { paymentStatus: 'PENDING' }
    })

    expect(pendingClasses.length).toBe(1)
  })

  afterEach(async () => {
    // Cleanup test data
    await prisma.class.deleteMany()
    await prisma.student.deleteMany()
    await prisma.user.deleteMany()
  })
})