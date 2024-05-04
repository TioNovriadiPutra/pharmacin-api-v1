import ForbiddenException from '#exceptions/forbidden_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { Role } from '../enums/role_enum.js'
import DataNotFoundException from '#exceptions/data_not_found_exception'
import Profile from '#models/profile'
import User from '#models/user'
import { updateAdministratorValidator } from '#validators/user'
import { Gender } from '../enums/gender_enum.js'
import ValidationException from '#exceptions/validation_exception'

export default class EmployeesController {
  async getEmployees({ response, bouncer, auth }: HttpContext) {
    try {
      if (await bouncer.with('EmployeePolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const employeeData = await db.rawQuery(
        `SELECT
          u.id,
          u.email,
          p.full_name,
          CASE
            WHEN p.gender = 'male' THEN 'Laki-laki'
            WHEN p.gender = 'female' THEN 'Perempuan'
          END AS gender,
          p.phone,
          p.address
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.clinic_id = ? AND u.role_id = ?`,
        [auth.user!.clinicId, Role['NURSE']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: employeeData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async updateEmployee({ request, response, params, bouncer }: HttpContext) {
    try {
      const userData = await User.findOrFail(params.id)
      const employeeData = await Profile.findByOrFail('user_id', params.id)

      if (await bouncer.with('EmployeePolicy').denies('handle', userData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(updateAdministratorValidator)

      employeeData.fullName = data.fullName
      employeeData.gender = data.gender as Gender
      employeeData.phone = data.phone
      employeeData.address = data.address

      await employeeData.save()

      return response.ok({
        message: 'Data karyawan berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data karyawan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteEmployee({ response, bouncer, params }: HttpContext) {
    try {
      const employeeData = await User.findOrFail(params.id)

      if (await bouncer.with('EmployeePolicy').denies('handle', employeeData)) {
        throw new ForbiddenException()
      }

      await employeeData.delete()

      return response.ok({
        message: 'Data karyawan berhasil dihapus!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data karyawan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
