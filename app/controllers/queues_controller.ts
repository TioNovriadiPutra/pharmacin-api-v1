import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { QueueStatus } from '../enums/queue_enum.js'
import Queue from '#models/queue'
import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import Patient from '#models/patient'
import DoctorAssistant from '#models/doctor_assistant'
import Doctor from '#models/doctor'

export default class QueuesController {
  async getConsultWaitQueue({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('QueuePolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const queueData = await db.rawQuery(
        `SELECT
          q.id,
          q.registration_number,
          p.full_name,
          p.record_number,
          p.gender,
          q.created_at,
          q.status
         FROM queues q
         JOIN patients p ON q.patient_id = p.id
         WHERE q.clinic_id = ? AND q.status = ?
         ORDER BY q.created_at ASC`,
        [auth.user!.clinicId, QueueStatus['CONSULT_WAIT']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: { queue: queueData[0], total: queueData[0].length },
      })
    } catch (error) {
      throw error
    }
  }

  async getDoctorConsultWaitQueue({ response, auth }: HttpContext) {
    const doctorAssistant = await DoctorAssistant.query()
      .whereHas('profile', (builderProfile) => {
        builderProfile.whereHas('user', (builderUser) => {
          builderUser.where('id', auth.user!.id)
        })
      })
      .firstOrFail()

    const queueData = await db.rawQuery(
      `SELECT
        q.id,
        p.full_name,
        p.record_number,
        q.registration_number,
        CASE
          WHEN q.status = 'consult-wait' THEN 'Belum Dipanggil'
          WHEN q.status = 'consulting' THEN 'Sudah Dipanggil'
        END AS status
       FROM queues q
       JOIN patients p ON q.patient_id = p.id
       WHERE q.clinic_id = ? AND q.doctor_id = ? AND q.status = ? OR q.status = ?
       ORDER BY
        CASE
          WHEN q.status = 'consult-wait' THEN 0
          WHEN q.status = 'consulting' THEN 1
        END,
        q.created_at ASC`,
      [
        auth.user!.clinicId,
        doctorAssistant.doctorId,
        QueueStatus['CONSULT_WAIT'],
        QueueStatus['CONSULTING'],
      ]
    )

    return response.ok({
      message: 'Data fetched',
      data: { queue: queueData[0], total: queueData[0].length },
    })
  }

  async getDoctorConsultingQueue({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('QueuePolicy').denies('viewDoctor')) {
        throw new ForbiddenException()
      }

      const doctorData = await Doctor.query()
        .whereHas('profile', (builderProfile) => {
          builderProfile.whereHas('user', (builderUser) => {
            builderUser.where('id', auth.user!.id)
          })
        })
        .firstOrFail()

      const queueData = await db.rawQuery(
        `SELECT
          q.id,
          p.full_name,
          p.record_number,
          q.registration_number,
          DATE_FORMAT(q.created_at, '%Y-%m-%d') AS queue_date
         FROM queues q
         JOIN patients p ON q.patient_id = p.id
         WHERE q.clinic_id = ? AND q.doctor_id = ? AND q.status = ?
         ORDER BY q.created_at ASC`,
        [auth.user!.clinicId, doctorData.id, QueueStatus['CONSULTING']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: queueData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async getDoctorConsultingQueueDetail({ response, params, bouncer, auth }: HttpContext) {
    try {
      if (await bouncer.with('QueuePolicy').denies('viewDoctor')) {
        throw new ForbiddenException()
      }

      const queueData = await db.rawQuery(
        `SELECT
          q.registration_number,
          p.record_number,
          p.full_name,
          CONCAT(p.pob, ", ", DATE_FORMAT(p.dob, "%d %M %Y")) AS ttl,
          p.address,
          DATE_FORMAT(q.created_at, "%Y-%m-%d") AS queue_date,
          CONCAT(pd.full_name, ", ", ds.speciality_title) AS doctor,
          p.allergy
         FROM queues q
         JOIN patients p ON q.patient_id = p.id
         JOIN doctors d ON q.doctor_id = d.id
         JOIN profiles pd ON d.profile_id = pd.id
         JOIN doctor_specialists ds ON d.speciality_id = ds.id
         WHERE q.id = ? AND pd.user_id = ? AND q.status = ?`,
        [params.id, auth.user!.id, QueueStatus['CONSULTING']]
      )

      if (queueData[0].length === 0) {
        throw new DataNotFoundException('Data pasien tidak ditemukan!')
      }

      return response.ok({
        message: 'Data fetched!',
        data: queueData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async getPharmaciDrugPickUpQueue({ response, bouncer, auth }: HttpContext) {
    try {
      if (await bouncer.with('QueuePolicy').denies('viewPharmacyQueue')) {
        throw new ForbiddenException()
      }

      const queueData = await db.rawQuery(
        `SELECT
          q.id,
          p.full_name,
          p.record_number,
          q.registration_number,
          q.status
         FROM queues q
         JOIN patients p ON q.patient_id = p.id
         WHERE q.clinic_id = ? AND q.status = ?
         ORDER BY q.updated_at ASC`,
        [auth.user!.clinicId, QueueStatus['DRUG_PICK_UP']]
      )

      return response.ok({
        message: 'Data fetched!',
        data: queueData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async changeStatusToConsultingQueue({ response, params, bouncer }: HttpContext) {
    try {
      const queueData = await Queue.findOrFail(params.id)

      if (await bouncer.with('QueuePolicy').denies('changeStatusToConsultingQueue', queueData)) {
        throw new ForbiddenException()
      }

      queueData.status = QueueStatus['CONSULTING']

      await queueData.save()

      return response.ok({
        message: queueData.registrationNumber,
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data antrian tidak ditemukan!')
      } else if (error.status === 403) {
        throw error
      }
    }
  }

  async cancelQueue({ response, params, bouncer }: HttpContext) {
    try {
      const queueData = await Queue.findOrFail(params.id)

      if (await bouncer.with('QueuePolicy').denies('cancelQueue', queueData)) {
        throw new ForbiddenException()
      }

      const patientData = await Patient.findOrFail(queueData.patientId)
      patientData.ready = true

      await queueData.delete()
      await patientData.save()

      return response.ok({
        message: 'Antrian dibatalkan!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data antrian tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
