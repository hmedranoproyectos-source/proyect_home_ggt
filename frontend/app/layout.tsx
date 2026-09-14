import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ProveedoresApp } from '@/componentes/proveedores-app'
import './globals.css'

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'Facturación electrónica | Inversiones Duquin',
	description:
		'Gestión de facturación electrónica desde la recepción hasta el registro en Siesa',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="es" className={inter.variable} suppressHydrationWarning>
			<body>
				<ProveedoresApp>{children}</ProveedoresApp>
			</body>
		</html>
	)
}
