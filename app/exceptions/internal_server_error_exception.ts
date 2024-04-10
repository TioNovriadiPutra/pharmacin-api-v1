import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class InternalServerErrorException extends Exception {
  constructor(
    message: string = 'Internal Server Error',
    options: {
      code: string
      status: number
    } = {
      code: 'E_INTERNAL_SERVER_ERROR',
      status: 500,
    }
  ) {
    super(message, options)
  }

  handle(error: any, ctx: HttpContext) {
    return ctx.response.internalServerError({
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    })
  }
}
