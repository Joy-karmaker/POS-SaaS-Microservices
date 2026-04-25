import axios from 'axios'

function readObjectMessage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null
  }

  const value = body.error ?? body.message ?? body.status
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim()
  }

  return null
}

export function getResponseMessage(response, fallbackMessage = '') {
  const objectMessage = readObjectMessage(response?.data)
  if (objectMessage) {
    return objectMessage
  }

  if (typeof response?.data === 'string' && response.data.trim() !== '') {
    return response.data.trim()
  }

  if (typeof response?.statusText === 'string' && response.statusText.trim() !== '') {
    return response.statusText.trim()
  }

  return fallbackMessage
}

export function getErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    const responseMessage = getResponseMessage(error.response, '')
    if (responseMessage !== '') {
      return responseMessage
    }

    if (typeof error.message === 'string' && error.message.trim() !== '') {
      return error.message
    }

    return fallbackMessage
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return fallbackMessage
}
