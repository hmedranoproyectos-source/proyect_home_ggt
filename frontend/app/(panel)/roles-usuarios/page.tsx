'use client'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { TabBuzon } from './tab-buzon'
import { TabCompanias } from './tab-companias'
import { TabRoles } from './tab-roles'
import { TabUsuarios } from './tab-usuarios'
import { sxTabsAzul } from '@/lib/estilos-ui'

export default function RolesUsuariosPage() {
	const [tab, setTab] = useState(0)

	return (
		<Box>
			<EncabezadoPagina titulo="Roles y usuarios" />
			<Tabs
				value={tab}
				onChange={(_, value: number) => setTab(value)}
				sx={sxTabsAzul}
			>
				<Tab label="Usuarios" />
				<Tab label="Roles y permisos" />
				<Tab label="Compañías" />
				<Tab label="Buzón" />
			</Tabs>
			{tab === 0 ? (
				<TabUsuarios />
			) : tab === 1 ? (
				<TabRoles />
			) : tab === 2 ? (
				<TabCompanias />
			) : (
				<TabBuzon />
			)}
		</Box>
	)
}
