import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import ValidationException from '#exceptions/validation_exception'
import Clinic from '#models/clinic'
import { updateClinicValidator } from '#validators/clinic'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { Cashier } from '../enums/cashier_enum.js'
import { DateTime } from 'luxon'
import Profile from '#models/profile'
import CashierHistory from '#models/cashier_history'
import BadRequestException from '#exceptions/bad_request_exception'

export default class ClinicsController {
  async getClinicDailyReport({ response, auth }: HttpContext) {
    try {
      const reportData = await db.rawQuery(
        `SELECT
          COUNT(st.id) AS total_transaction,
          IFNULL(
            CAST(
              SUM(st.total_price) AS INTEGER
            ),
            0
          ) AS total_transaction_price,
          COUNT(q.id) AS total_patient,
          CAST(
            SUM(
              CASE
                WHEN q.status != "done" THEN 1
                ELSE 0
              END
            ) AS INTEGER
          ) AS rest_patient
         FROM clinics c
         LEFT JOIN queues q ON (
          c.id = q.clinic_id AND DATE(q.created_at) = CURRENT_DATE()
         )
        LEFT JOIN selling_transactions st ON (
          q.id = st.queue_id AND DATE(st.created_at) = CURRENT_DATE() AND st.status = 1 AND st.pick_up_status = 1
         )
         WHERE c.id = ?
         GROUP BY c.id`,
        [auth.user!.clinicId]
      )

      const transactionData = await db.rawQuery(
        `SELECT
          st.invoice_number,
          st.total_price
         FROM selling_transactions st
         WHERE
          st.clinic_id = ?
          AND st.status = 1
          AND st.pick_up_status = 1
          ORDER BY st.created_at DESC
          LIMIT 10`,
        [auth.user!.clinicId]
      )

      const cashierData = await db.rawQuery(
        `SELECT
          DATE_FORMAT(open_cashier_at, "%d-%m-%Y") AS date,
          DATE_FORMAT(open_cashier_at, "%H:%i") AS open,
          DATE_FORMAT(close_cashier_at, "%H:%i") AS close
         FROM cashier_histories
         WHERE clinic_id = ?
         ORDER BY open_cashier_at DESC
         LIMIT 10`,
        [auth.user!.clinicId]
      )

      const finalData = {
        report: reportData[0],
        selling: transactionData[0],
        cashier: cashierData[0],
      }

      return response.ok({
        message: 'Data fetched!',
        data: finalData,
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data klinik tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

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

  async openCashier({ response, auth, bouncer }: HttpContext) {
    let clinicData = null
    let profileData = null

    try {
      clinicData = await Clinic.findOrFail(auth.user!.clinicId)
      profileData = await Profile.findByOrFail('user_id', auth.user!.id)

      if (await bouncer.with('ClinicPolicy').denies('handleCashier', clinicData)) {
        throw new ForbiddenException()
      }

      if (clinicData.cashierStatus === Cashier['OPEN']) {
        throw new BadRequestException('Kasir belum ditutup!')
      }

      clinicData.cashierStatus = Cashier['OPEN']
      clinicData.openCashierAt = DateTime.now()
      clinicData.openBy = profileData.fullName

      await clinicData.save()

      return response.ok({
        message: 'Klinik berhasil membuka kasir!',
      })
    } catch (error) {
      if (error.status === 404) {
        if (clinicData) {
          throw new DataNotFoundException('Data profile tidak ditemukan!')
        } else {
          throw new DataNotFoundException('Data klinik tidak ditemukan!')
        }
      } else {
        throw error
      }
    }
  }

  async closeCashier({ response, auth, bouncer }: HttpContext) {
    let clinicData = null
    let profileData = null

    try {
      clinicData = await Clinic.findOrFail(auth.user!.clinicId)
      profileData = await Profile.findByOrFail('user_id', auth.user!.id)

      if (await bouncer.with('ClinicPolicy').denies('handleCashier', clinicData)) {
        throw new ForbiddenException()
      }

      if (clinicData.cashierStatus === Cashier['CLOSE']) {
        throw new BadRequestException('Kasir belum dibuka!')
      }

      const newCashierHistory = new CashierHistory()
      newCashierHistory.status = Cashier['CLOSE']
      newCashierHistory.openCashierAt = clinicData.openCashierAt!
      newCashierHistory.closeCashierAt = DateTime.now()
      newCashierHistory.openBy = clinicData.openBy!
      newCashierHistory.closeBy = profileData.fullName

      clinicData.cashierStatus = Cashier['CLOSE']
      clinicData.openCashierAt = undefined
      clinicData.openBy = undefined

      await clinicData.related('cashierHistories').save(newCashierHistory)

      return response.ok({
        message: 'Klinik berhasil menutup kasir!',
      })
    } catch (error) {
      if (error.status === 404) {
        if (clinicData) {
          throw new DataNotFoundException('Data profile tidak ditemukan!')
        } else {
          throw new DataNotFoundException('Data klinik tidak ditemukan!')
        }
      } else {
        throw error
      }
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
