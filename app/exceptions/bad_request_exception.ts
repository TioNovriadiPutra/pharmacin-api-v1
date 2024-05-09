import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class BadRequestException extends Exception {
  constructor(
    message: string,
    options: {
      code: string
      status: number
    } = {
      code: 'E_BAD_REQUEST',
      status: 400,
    }
  ) {
    super(message, options)
  }

  async handle(error: any, ctx: HttpContext) {
    return ctx.response.badRequest({
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    })
  }
}
