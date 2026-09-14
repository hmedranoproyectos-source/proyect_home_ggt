'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { tema } from '@/lib/tema'

interface Props {
	children: React.ReactNode
}

export function ProveedoresApp({ children }: Props) {
	return (
		<AppRouterCacheProvider>
			<ThemeProvider theme={tema}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</AppRouterCacheProvider>
	)
}
