import DataNotFoundException from '#exceptions/data_not_found_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { Role } from '../enums/role_enum.js'
import ForbiddenException from '#exceptions/forbidden_exception'
import User from '#models/user'
import { updateAdministratorValidator } from '#validators/user'
import Profile from '#models/profile'
import { Gender } from '../enums/gender_enum.js'
import ValidationException from '#exceptions/validation_exception'

export default class UsersController {
  async getUserProfile({ response, auth }: HttpContext) {
    try {
      const profileData = await db.rawQuery(
        `SELECT
          u.id,
          p.full_name,
          r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN profiles p ON u.id = p.user_id
         WHERE u.id = ?`,
        [auth.user!.id]
      )

      return response.ok({
        message: 'Data fetched!',
        data: profileData[0][0],
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data profile tidak ditemukan!')
      } else {
        console.log(error)
      }
    }
  }

  async getUserDetail({ response, bouncer, params }: HttpContext) {
    try {
      const userData = await db.rawQuery(
        `SELECT
          u.id,
          p.full_name,
          CASE
            WHEN p.gender = "male" THEN "Laki-laki"
            WHEN p.gender = "female" THEN "Perempuan"
          END AS gender,
          p.phone,
          p.address,
          u.clinic_id AS clinicId
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.id = ?`,
        [params.id]
      )

      if (userData[0].length === 0) {
        throw new DataNotFoundException('Data akun tidak ditemukan!')
      }

      if (await bouncer.with('UserPolicy').denies('viewDetail', userData[0][0])) {
        throw new ForbiddenException()
      }

      delete userData[0][0].clinicId

      return response.ok({
        message: 'Data fetched!',
        data: userData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async getAdministrators({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('UserPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const userData = await db.rawQuery(
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
         WHERE u.clinic_id = ? AND u.role_id = ?
         ORDER BY p.full_name ASC`,
        [auth.user!.clinicId, Role['ADMINISTRATOR']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: userData[0],
      })
    } catch (error) {
      if (error.status === 403) {
        throw error
      }
    }
  }

  async updateAdministrator({ request, response, bouncer, params }: HttpContext) {
    try {
      const administratorData = await User.findOrFail(params.id)
      const profileData = await Profile.findByOrFail('user_id', params.id)

      if (await bouncer.with('UserPolicy').denies('handleAdministrator', administratorData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(updateAdministratorValidator)

      profileData.fullName = data.fullName
      profileData.gender = data.gender as Gender
      profileData.phone = data.phone
      profileData.address = data.address

      await profileData.save()

      return response.ok({
        message: 'Data administrator berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data administrator tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteAdministrator({ response, bouncer, params }: HttpContext) {
    try {
      const administratorData = await User.findOrFail(params.id)

      if (await bouncer.with('UserPolicy').denies('handleAdministrator', administratorData)) {
        throw new ForbiddenException()
      }

      await administratorData.delete()

      return response.ok({
        message: 'Data administrator berhasil dihapus!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data karyawan tidak ditemukan!')
      } else if (error.status === 403) {
        throw error
      }
    }
  }
}
