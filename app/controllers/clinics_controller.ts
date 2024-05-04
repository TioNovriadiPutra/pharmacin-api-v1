import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import ValidationException from '#exceptions/validation_exception'
import Clinic from '#models/clinic'
import { updateClinicValidator } from '#validators/clinic'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ClinicsController {
  async getClinicDetail({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('ClinicPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const clinicData = await db.rawQuery(
        `SELECT
          clinic_name,
          address,
          clinic_phone,
          outpatient_fee,
          selling_fee
         FROM clinics
         WHERE id = ?`,
        [auth.user!.clinicId]
      )

      if (clinicData[0].length === 0) {
        throw new DataNotFoundException('Data klinik tidak ditemukan!')
      }

      return response.ok({
        message: 'Data fetched!',
        data: clinicData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async updateClinic({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('ClinicPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(updateClinicValidator)

      const clinicData = await Clinic.findOrFail(auth.user!.clinicId)
      clinicData.clinicName = data.clinicName
      clinicData.clinicPhone = data.clinicPhone
      clinicData.address = data.address
      clinicData.outpatientFee = data.outpatientFee
      clinicData.sellingFee = data.sellingFee

      await clinicData.save()

      return response.ok({
        message: 'Data klinik berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 403) {
        throw error
      } else if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data klinik tidak ditemukan!')
      }
    }
  }
}
