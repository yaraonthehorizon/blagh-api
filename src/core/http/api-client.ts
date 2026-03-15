import axios, { AxiosInstance, AxiosError } from 'axios'
import { loggingService } from '../../modules/logging/services/logging.service'

// Extend Axios types so we can pass a timer state
declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: { startTime: number }
    }
}

export function createApiClient(baseURL?: string): AxiosInstance {
    const client = axios.create({ baseURL })

    // Request Interceptor: Start the timer
    client.interceptors.request.use((config) => {
        config.metadata = { startTime: Date.now() }
        return config
    })

    // Response Interceptor: Stop the timer and calculate response time
    client.interceptors.response.use(
        (response) => {
            const duration =
                Date.now() - (response.config.metadata?.startTime || 0)
            loggingService.logPerformance(
                `EXTERNAL_API_CALL: ${response.config.url}`,
                duration,
                {
                    method: response.config.method?.toUpperCase(),
                    status: response.status,
                }
            )
            return response
        },
        (error: AxiosError) => {
            const duration =
                Date.now() - (error.config?.metadata?.startTime || 0)
            loggingService.error(
                `EXTERNAL_API_CALL_FAILED: ${error.config?.url} after ${duration}ms`,
                {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                        ? JSON.stringify(error.response.data, null, 2)
                        : undefined,
                }
            )
            return Promise.reject(error)
        }
    )

    return client
}
