import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class OccupationsController {
  async getOccupations({ response }: HttpContext) {
    const occupationData = await db.rawQuery(
      `SELECT
          id,
          occupation_name
         FROM occupations`
    )

    return response.ok({
      message: 'Data fetched!',
      data: occupationData[0],
    })
  }
}
