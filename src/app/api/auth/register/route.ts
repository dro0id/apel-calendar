import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique username
    let username = generateSlug(name)
    let counter = 1
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${generateSlug(name)}-${counter}`
      counter++
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
      }
    })

    // Create default availability (Monday to Friday, 9:00 - 17:00)
    const defaultAvailability = [1, 2, 3, 4, 5].map(day => ({
      userId: user.id,
      dayOfWeek: day,
      startTime: 540, // 9:00
      endTime: 1020, // 17:00
    }))

    await prisma.availability.createMany({
      data: defaultAvailability
    })

    // Create a default event type
    await prisma.eventType.create({
      data: {
        userId: user.id,
        title: "Réunion de 30 minutes",
        slug: "reunion-30-min",
        description: "Une réunion rapide de 30 minutes",
        duration: 30,
        color: "#3b82f6",
      }
    })

    return NextResponse.json({
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    )
  }
}
