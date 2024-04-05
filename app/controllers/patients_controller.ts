import type { HttpContext } from '@adonisjs/core/http'
import skipData from '../helpers/pagination.js'
import db from '@adonisjs/lucid/services/db'
import { addPatientValidator, patientQueueValidator } from '#validators/patient'
import Patient from '#models/patient'
import { Gender } from '../enums/gender_enum.js'
import Occupation from '#models/occupation'
import ValidationException from '#exceptions/validation_exception'
import { DateTime } from 'luxon'
import idConverter from '../helpers/id_converter.js'
import DataNotFoundException from '#exceptions/data_not_found_exception'
import Queue from '#models/queue'
import ForbiddenException from '#exceptions/forbidden_exception'
import moment from 'moment'
import getRandomNumId from '../helpers/random_num.js'

export default class PatientsController {
  async getPatients({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('PatientPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const page = request.input('page', 1)
      const perPage = request.input('perPage', 10)
      const searchTerm = request.input('searchTerm', '')
      const search = `%${searchTerm}%`

      const patientData = await db.rawQuery(
        `SELECT
        id,
        full_name,
        record_number,
        phone,
        address,
        CASE
          WHEN gender = 'male' THEN 'Laki-laki'
          WHEN gender = 'female' THEN 'Perempuan'
        END AS gender,
        DATE_FORMAT(dob, "%Y-%m-%d") AS date_birth,
        ready
       FROM patients 
       WHERE clinic_id = ? AND (full_name LIKE ? OR nik LIKE ? OR record_number LIKE ?)
       ORDER BY full_name ASC
       LIMIT ? OFFSET ?`,
        [auth.user!.clinicId, search, search, search, perPage, skipData(page, perPage)]
      )

      return response.ok({
        message: 'Data fetched!',
        data: patientData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async getQueuingPatients({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('PatientPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const patientData = await db.rawQuery(
        `SELECT
        q.id,
        q.registration_number,
        p.full_name,
        p.record_number,
        CASE
          WHEN p.gender = 'male' THEN 'Laki-laki'
          WHEN p.gender = 'female' THEN 'Perempuan'
        END AS gender,
        DATE_FORMAT(q.created_at, "%Y-%m-%d") AS created_at,
        CASE
          WHEN q.status = 'consult-wait' THEN 'Belum Dipanggil'
          WHEN q.status = 'consulting' THEN 'Sudah Dipanggil'
          WHEN q.status = 'drug-wait' THEN 'Menunggu Obat'
          WHEN q.status = 'drug-pick-up' THEN 'Obat diserahkan'
          ELSE 'selesai'
        END as status
       FROM patients p
       JOIN queues q ON p.id = q.patient_id
       WHERE p.ready = 0 AND p.clinic_id = ?
       ORDER BY q.created_at ASC`,
        [auth.user!.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: patientData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async addPatient({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('PatientPolicy').denies('handle')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addPatientValidator)

      const occupationData = await Occupation.findOrFail(data.occupationId)

      const newPatient = new Patient()
      newPatient.fullName = data.fullName
      newPatient.nik = data.nik
      newPatient.address = data.address
      newPatient.gender = data.gender as Gender
      newPatient.occupationName = occupationData.occupationName
      newPatient.pob = data.pob
      newPatient.dob = DateTime.fromISO(data.dob)
      newPatient.phone = data.phone
      newPatient.allergy = data.allergy
      newPatient.clinicId = auth.user!.clinicId

      await occupationData.related('patients').save(newPatient)

      newPatient.recordNumber = `RM${idConverter(newPatient.id, 6)}`

      await newPatient.save()

      return response.created({
        message: 'Penambahan pasien berhasil!',
      })
    } catch (error: any) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Jenis pekerjaan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async addPatientQueue({ request, response, auth, params, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('QueuePolicy').denies('addPatientQueue')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(patientQueueValidator)

      const patientData = await Patient.findOrFail(params.id)
      patientData.ready = false

      const newQueue = new Queue()
      newQueue.doctorId = data.doctorId
      newQueue.clinicId = auth.user!.clinicId
      newQueue.registrationNumber = `REG/${moment().format('YYYYMMDD')}/${getRandomNumId(4)}`

      await patientData.related('queue').save(newQueue)

      return response.created({
        message: 'Pasien masuk antrian!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data pasien tidak ditemukan!')
      } else if (error.status === 403) {
        throw error
      }
    }
  }
}
