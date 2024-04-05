import ForbiddenException from '#exceptions/forbidden_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class DoctorSpecialistsController {
  async getSpecialities({ response, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DoctorSpecialistPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const specialityData = await db.rawQuery(
        `SELECT
          id,
          CONCAT(speciality_name, " (", speciality_title, ")") AS speciality
         FROM doctor_specialists`
      )

      return response.ok({
        message: 'Data fetched!',
        data: specialityData[0],
      })
    } catch (error) {
      throw error
    }
  }
}
