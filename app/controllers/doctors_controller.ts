import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { Role } from '../enums/role_enum.js'
import User from '#models/user'
import Profile from '#models/profile'
import { addAssessmentValidator, updateDoctorValidator } from '#validators/doctor'
import { Gender } from '../enums/gender_enum.js'
import Doctor from '#models/doctor'
import ValidationException from '#exceptions/validation_exception'
import Record from '#models/record'
import Queue from '#models/queue'
import { QueueStatus } from '../enums/queue_enum.js'
import SellingTransaction from '#models/selling_transaction'
import { DateTime } from 'luxon'
import idConverter from '../helpers/id_converter.js'
import Drug from '#models/drug'
import SellingShoppingCart from '#models/selling_shopping_cart'
import RecordDrugAssessment from '#models/record_drug_assessment'
import Action from '#models/action'
import ActionCart from '#models/action_cart'
import InsufficientStockException from '#exceptions/insufficient_stock_exception'

export default class DoctorsController {
  async getDoctors({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DoctorPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const doctorData = await db.rawQuery(
        `SELECT
          u.id,
          d.id AS doctor_id,
          CONCAT(p.full_name, ", ", ds.speciality_title) AS full_name,
          IF(p.gender = "male", "Laki-laki", "Perempuan") AS gender,
          p.phone,
          ds.speciality_name,
          p.address
         FROM doctors d
         JOIN doctor_specialists ds ON d.speciality_id = ds.id
         JOIN profiles p ON d.profile_id = p.id
         JOIN users u ON u.id = p.user_id
         WHERE d.clinic_id = ?
         ORDER BY p.full_name ASC`,
        [auth.user!.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: doctorData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async getDoctorDetail({ response, bouncer, params }: HttpContext) {
    try {
      if (await bouncer.with('DoctorPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const doctorData = await db.rawQuery(
        `SELECT
          p.full_name,
          JSON_OBJECT(
            'label', IF(p.gender = 'male', 'Laki-laki', 'Perempuan'),
            'value', p.gender
          ) AS gender,
          p.phone,
          JSON_OBJECT(
            'label', CONCAT(ds.speciality_name, ' (', ds.speciality_title, ')'),
            'value', ds.id
          ) AS speciality,
          p.address
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         JOIN doctors d ON p.id = d.profile_id
         JOIN doctor_specialists ds ON d.speciality_id = ds.id
         WHERE u.id = ? AND u.role_id = ?`,
        [params.id, Role['DOCTOR']]
      )

      if (doctorData[0].length === 0) {
        throw new DataNotFoundException('Data dokter tidak ditemukan!')
      }

      Object.assign(doctorData[0][0], {
        gender: JSON.parse(doctorData[0][0].gender),
        speciality: JSON.parse(doctorData[0][0].speciality),
      })

      return response.ok({
        message: 'Data fetched!',
        data: doctorData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async updateDoctor({ request, response, bouncer, params }: HttpContext) {
    try {
      const userData = await User.findOrFail(params.id)
      const profileData = await Profile.findByOrFail('user_id', params.id)
      const doctorData = await Doctor.findByOrFail('profile_id', profileData.id)

      if (await bouncer.with('DoctorPolicy').denies('create', userData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(updateDoctorValidator)

      profileData.fullName = data.fullName
      profileData.gender = data.gender as Gender
      profileData.phone = data.phone
      profileData.address = data.address

      doctorData.specialityId = data.specialityId

      await profileData.save()
      await doctorData.save()

      return response.ok({
        message: 'Data dokter berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data dokter tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteDoctor({ response, bouncer, params }: HttpContext) {
    try {
      const doctorData = await User.findOrFail(params.id)

      if (await bouncer.with('DoctorPolicy').denies('create', doctorData)) {
        throw new ForbiddenException()
      }

      await doctorData.delete()

      return response.ok({
        message: 'Data dokter berhasil dihapus!',
      })
    } catch (error) {
      throw error
    }
  }

  async addAssessment({ request, response, bouncer, params, auth }: HttpContext) {
    try {
      const drugCartsArr = []
      const recordDrugAssesmentsArr = []
      const actionsArr = []

      const queueData = await Queue.query()
        .preload('clinic')
        .preload('patient')
        .preload('doctor', (tmp) => {
          tmp.preload('profile')
          tmp.preload('doctorSpeciality')
        })
        .where('id', params.id)
        .firstOrFail()

      if (await bouncer.with('DoctorPolicy').denies('assessment', queueData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addAssessmentValidator)

      const newRecord = new Record()
      newRecord.weight = data.weight
      newRecord.height = data.height
      newRecord.temperature = data.temperature
      newRecord.bloodPressure = data.bloodPressure
      newRecord.pulse = data.pulse
      newRecord.subjective = data.subjective
      newRecord.objective = data.objective
      newRecord.plan = data.plan
      newRecord.assessment = data.assessment
      newRecord.doctorName =
        queueData.doctor.profile.fullName + ', ' + queueData.doctor.doctorSpeciality.specialityTitle
      newRecord.clinicName = queueData.clinic.clinicName
      newRecord.clinicPhone = queueData.clinic.clinicPhone
      newRecord.patientId = queueData.patient.id
      newRecord.doctorId = queueData.doctor.id
      newRecord.clinicId = queueData.clinic.id

      const newSellingTransaction = new SellingTransaction()
      newSellingTransaction.registrationNumber = queueData.registrationNumber
      newSellingTransaction.totalPrice = data.totalPrice
      newSellingTransaction.clinicId = auth.user!.clinicId
      newSellingTransaction.patientId = queueData.patientId
      newSellingTransaction.queueId = params.id

      if (data.drugCarts) {
        for (const cart of data.drugCarts) {
          try {
            const drugData = await Drug.findOrFail(cart.drugId)

            if (drugData.totalStock === 0 || drugData.totalStock < cart.quantity) {
              throw new InsufficientStockException(drugData.drug)
            }

            const newSellingShoppingCart = new SellingShoppingCart()
            newSellingShoppingCart.drugName = drugData.drug
            newSellingShoppingCart.sellingPrice = drugData.sellingPrice
            newSellingShoppingCart.instruction = cart.instruction
            newSellingShoppingCart.unitName = drugData.unitName
            newSellingShoppingCart.quantity = cart.quantity
            newSellingShoppingCart.totalPrice = cart.totalPrice
            newSellingShoppingCart.drugId = cart.drugId

            const newRecordDrugAssessment = new RecordDrugAssessment()
            newRecordDrugAssessment.drugName = drugData.drug
            newRecordDrugAssessment.unitName = drugData.unitName
            newRecordDrugAssessment.instruction = cart.instruction
            newRecordDrugAssessment.drugId = cart.drugId

            drugCartsArr.push(newSellingShoppingCart)
            recordDrugAssesmentsArr.push(newRecordDrugAssessment)
          } catch (error) {
            if (error.status === 400) {
              throw error
            } else {
              throw new DataNotFoundException('Data obat tidak ditemukan!', 1)
            }
          }
        }
      }

      if (data.actions) {
        for (const action of data.actions) {
          try {
            const actionData = await Action.findOrFail(action)

            const newActionCart = new ActionCart()
            newActionCart.actionName = actionData.actionName
            newActionCart.actionPrice = actionData.actionPrice
            newActionCart.actionId = actionData.id

            actionsArr.push(newActionCart)
          } catch (error) {
            throw new DataNotFoundException('Data tindakan tidak ditemukan!', 1)
          }
        }
      }

      queueData.status = QueueStatus['DRUG_PICK_UP']

      await newRecord.related('sellingTransaction').save(newSellingTransaction)

      const invoiceDate = DateTime.now()

      newSellingTransaction.invoiceNumber = `INV/${invoiceDate.year}${invoiceDate.month}${invoiceDate.day}/${idConverter(newSellingTransaction.id)}`

      await newSellingTransaction.save()

      if (drugCartsArr.length > 0) {
        for (const newCart of drugCartsArr) {
          await newSellingTransaction.related('sellingShoppingCarts').save(newCart)
        }

        for (const newRecordDrug of recordDrugAssesmentsArr) {
          await newRecord.related('recordDrugsAssessment').save(newRecordDrug)
        }
      }

      if (actionsArr.length > 0) {
        for (const newActionCart of actionsArr) {
          await newSellingTransaction.related('actionCarts').save(newActionCart)
        }
      }

      await queueData.save()

      return response.created({
        message: 'Data assessment berhasil ditambahkan!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        if (error.rc === 0) {
          throw new DataNotFoundException('Data antrian tidak ditemukan!')
        } else {
          throw error
        }
      } else {
        throw error
      }
    }
  }
}
