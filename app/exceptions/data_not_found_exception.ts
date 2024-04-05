import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class DataNotFoundException extends Exception {
  rc: 0 | 1

  constructor(
    message: string,
    rc: 0 | 1 = 0,
    option: {
      code?: string
      status?: number
    } = {
      code: 'E_DATA_NOT_FOUND',
      status: 404,
    }
  ) {
    super(message, option)
    this.rc = rc
  }

  async handle(error: any, ctx: HttpContext) {
    ctx.response.notFound({
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        rc: this.rc,
      },
    })
  }
}
