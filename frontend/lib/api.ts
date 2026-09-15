import axios from 'axios'
import { cerrarSesion, leerSesion } from './sesion'

// nginx enruta /api/ -> backend en el mismo origen (ver nginx/nginx.conf),
// por eso el default es relativo y no una URL absoluta.
export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
})

api.interceptors.request.use((config) => {
	if (config.headers.Authorization) {
		return config
	}
	const sesion = leerSesion()
	if (sesion?.token) {
		config.headers.Authorization = `Bearer ${sesion.token}`
	}
	return config
})

api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response?.status === 401) {
			cerrarSesion()
			if (typeof window !== 'undefined') {
				window.location.href = '/login'
			}
		}
		return Promise.reject(err)
	},
)
