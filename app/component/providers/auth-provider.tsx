'use client'

import React, { createContext, useContext } from 'react'

interface UserSession {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EMPLEADO'
}

const AuthContext = createContext<{ user: UserSession | null }>({ user: null })

export function AuthProvider({
  user,
  children,
}: {
  user: UserSession | null
  children: React.ReactNode
}) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)