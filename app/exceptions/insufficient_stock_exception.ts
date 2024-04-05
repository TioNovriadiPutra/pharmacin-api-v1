import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class InsufficientStockException extends Exception {
  productName: string

  constructor(
    productName: string,
    message: string = 'Stok tidak cukup!',
    option: {
      code: string
      status: number
    } = {
      code: 'E_INSUFFICIENT_STOCK',
      status: 400,
    }
  ) {
    super(message, option)
    this.productName = productName
  }

  handle(error: any, ctx: HttpContext) {
    return ctx.response.badRequest({
      error: {
        message: `${this.productName}, ${error.message}`,
        code: error.code,
        status: error.status,
      },
    })
  }
}
