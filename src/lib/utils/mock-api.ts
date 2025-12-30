// Simulate API calls with delays
export const simulateApiCall = <T,>(
  data: T,
  delay: number = 1000
): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Simulate API error
export const simulateApiError = (
  message: string,
  delay: number = 1000
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}
