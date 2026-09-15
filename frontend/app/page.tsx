'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { leerSesion } from '@/lib/sesion'

export default function HomePage() {
	const router = useRouter()

	useEffect(() => {
		router.replace(leerSesion() ? '/dashboard' : '/login')
	}, [router])

	return null
}
