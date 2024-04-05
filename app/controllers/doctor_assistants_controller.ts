import ForbiddenException from '#exceptions/forbidden_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { Role } from '../enums/role_enum.js'
import DataNotFoundException from '#exceptions/data_not_found_exception'
import User from '#models/user'
import Profile from '#models/profile'
import { updateDoctorAssistantValidator } from '#validators/doctor_assistant'
import { Gender } from '../enums/gender_enum.js'
import DoctorAssistant from '#models/doctor_assistant'
import ValidationException from '#exceptions/validation_exception'

export default class DoctorAssistantsController {
  async getAssistants({ response, bouncer, auth }: HttpContext) {
    try {
      if (await bouncer.with('DoctorAssistantPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const assistantData = await db.rawQuery(
        `SELECT
          u.id,
          pu.full_name,
          pu.address,
          CONCAT(pd.full_name, ", ", ds.speciality_title) AS doctor_full_name
         FROM users u
         JOIN profiles pu ON u.id = pu.user_id
         JOIN doctor_assistants da ON pu.id = da.profile_id
         JOIN doctors d ON d.id = da.doctor_id
         JOIN doctor_specialists ds ON d.speciality_id = ds.id
         JOIN profiles pd ON d.profile_id = pd.id
         WHERE u.clinic_id = ? AND u.role_id = ?`,
        [auth.user!.clinicId, Role['DOCTOR_ASSISTANT']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: assistantData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async getAssistantDetail({ response, bouncer, params, auth }: HttpContext) {
    try {
      if (await bouncer.with('DoctorAssistantPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const assistantData = await db.rawQuery(
        `SELECT
          u.id,
          pu.full_name,
          JSON_OBJECT(
            'label', IF(pu.gender = 'male', 'Laki-laki', 'Perempuan'),
            'value', pu.gender
          ) AS gender,
          pu.phone,
          pu.address,
          JSON_OBJECT(
            'label', CONCAT(pd.full_name, ", ", ds.speciality_title),
            'value', d.id
          ) AS doctor
         FROM users u
         JOIN profiles pu ON u.id = pu.user_id
         JOIN doctor_assistants da ON pu.id = da.profile_id
         JOIN doctors d ON d.id = da.doctor_id
         JOIN doctor_specialists ds ON d.speciality_id = ds.id
         JOIN profiles pd ON d.profile_id = pd.id
         WHERE u.id = ? AND u.clinic_id = ?`,
        [params.id, auth.user!.clinicId]
      )

      if (assistantData[0].length === 0) {
        throw new DataNotFoundException('Data asisten tidak ditemukan!')
      }

      Object.assign(assistantData[0][0], {
        gender: JSON.parse(assistantData[0][0].gender),
        doctor: JSON.parse(assistantData[0][0].doctor),
      })

      return response.ok({
        message: 'Data fetched!',
        data: assistantData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async updateDoctorAssistant({ request, response, bouncer, params }: HttpContext) {
    try {
      const userData = await User.findOrFail(params.id)
      const profileData = await Profile.findByOrFail('user_id', params.id)
      const doctorAssistantData = await DoctorAssistant.findByOrFail('profile_id', profileData.id)

      if (await bouncer.with('DoctorAssistantPolicy').denies('handle', userData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(updateDoctorAssistantValidator)

      profileData.fullName = data.fullName
      profileData.gender = data.gender as Gender
      profileData.phone = data.phone
      profileData.address = data.address

      await profileData.save()

      doctorAssistantData.doctorId = data.doctorId

      await doctorAssistantData.save()

      return response.ok({
        message: 'Data asisten dokter berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data asisten tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteAssistant({ response, bouncer, params }: HttpContext) {
    try {
      const assistantData = await User.findOrFail(params.id)

      if (await bouncer.with('DoctorAssistantPolicy').denies('handle', assistantData)) {
        throw new ForbiddenException()
      }

      await assistantData.delete()

      return response.ok({
        message: 'Data asisten dokter berhasil dihapus!',
      })
    } catch (error) {
      throw error
    }
  }
}
