import DataNotFoundException from '#exceptions/data_not_found_exception'
import ValidationException from '#exceptions/validation_exception'
import Clinic from '#models/clinic'
import DrugFactory from '#models/drug_factory'
import { addClinicDrugFactory } from '#validators/drug_factory'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import skipData from '../helpers/pagination.js'
import ForbiddenException from '#exceptions/forbidden_exception'

export default class DrugFactoriesController {
  async getFactories({ request, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    const searchTerm = request.input('searchTerm', '')
    const search = `%${searchTerm}%`
    const factoryData = await db.rawQuery(
      `SELECT
        id,
        factory_name,
        factory_email,
        factory_phone
        FROM drug_factories
        INNER JOIN factory_partnerships ON drug_factories.id = factory_partnerships.drug_factory_id
        WHERE factory_partnerships.clinic_id = ? 
        AND (factory_name LIKE ? OR factory_email LIKE ? OR factory_phone LIKE ?)
        LIMIT ? OFFSET ?`,
      [auth.user!.clinicId, search, search, search, perPage, skipData(page, perPage)]
    )

    return response.ok({ message: 'Data fetched!', data: factoryData[0] })
  }

  async getFactoryDetail({ response, params, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugFactoryPolicy').denies('viewAllAndAdd')) {
        throw new ForbiddenException()
      }

      const factoryData = await DrugFactory.query()
        .select('id', 'factory_name', 'factory_email', 'factory_phone')
        .preload('drugs', (builder) => {
          builder
            .select(
              'id',
              'created_at',
              'drug',
              'drug_generic_name',
              'unit_name',
              'composition',
              'purchase_price',
              'selling_price',
              'total_stock',
              'drug_category_id'
            )
            .preload('drugCategory', (builder2) => {
              builder2.select('id', 'category_name')
            })
            .where('clinic_id', auth.user!.clinicId)
        })
        .where('id', params.id)
        .firstOrFail()

      return response.ok({ message: 'Data fetched!', data: factoryData })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data pabrik tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async addDrugFactory({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugFactoryPolicy').denies('viewAllAndAdd')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addClinicDrugFactory)

      const clinicData = await Clinic.findOrFail(auth.user!.clinicId)

      const drugFactoryData = await DrugFactory.firstOrCreate(
        {
          factoryName: data.factoryName,
        },
        {
          factoryName: data.factoryName,
          factoryEmail: data.factoryEmail,
          factoryPhone: data.factoryPhone,
        }
      )

      await clinicData.related('partnerships').attach([drugFactoryData.id])

      return response.created({ message: 'Data pabrik berhasil ditambahkan!' })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data klinik tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteFactory({ response, params, auth }: HttpContext) {
    try {
      const factoryData = await DrugFactory.findOrFail(params.id)

      await factoryData.related('partnerships').detach([auth.user!.clinicId])

      return response.ok({ message: 'Data pabrik berhasil dihapus!' })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data pabrik tidak ditemukan!')
      }
    }
  }
}
