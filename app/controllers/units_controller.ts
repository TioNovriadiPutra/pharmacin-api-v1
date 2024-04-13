import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import InternalServerErrorException from '#exceptions/internal_server_error_exception'
import ValidationException from '#exceptions/validation_exception'
import Unit from '#models/unit'
import { addUnitValidator } from '#validators/unit'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class UnitsController {
  async getUnits({ response, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('UnitPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const unitData = await db.rawQuery(
        `SELECT
        id,
        unit_name
       FROM units`
      )

      return response.ok({
        message: 'Data fetched!',
        data: unitData[0],
      })
    } catch (error) {
      if (error.status === 403) {
        throw error
      } else {
        throw new InternalServerErrorException()
      }
    }
  }

  async addUnit({ request, response, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('UnitPolicy').denies('create')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addUnitValidator)

      const newUnit = new Unit()
      newUnit.unitName = data.unitName

      await newUnit.save()

      return response.created({
        message: 'Satuan berhasil ditambahkan!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 403) {
        throw error
      }
    }
  }

  async updateUnit({ request, response, bouncer, params }: HttpContext) {
    try {
      if (await bouncer.with('UnitPolicy').denies('create')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addUnitValidator)

      const unitData = await Unit.findOrFail(params.id)
      unitData.unitName = data.unitName

      await unitData.save()

      return response.ok({
        message: 'Data satuan berhasil diedit!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data satuan tidak ditemukan!')
      } else if (error.status === 403) {
        throw error
      }
    }
  }

  async deleteUnit({ response, params, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('UnitPolicy').denies('create')) {
        throw new ForbiddenException()
      }

      const unitData = await Unit.findOrFail(params.id)

      await unitData.delete()

      return response.ok({ message: 'Data satuan berhasil dihapus!' })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data satuan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
