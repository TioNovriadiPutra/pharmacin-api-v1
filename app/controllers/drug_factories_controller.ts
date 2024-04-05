import DataNotFoundException from '#exceptions/data_not_found_exception'
import ValidationException from '#exceptions/validation_exception'
import Clinic from '#models/clinic'
import DrugFactory from '#models/drug_factory'
import { addClinicDrugFactory } from '#validators/drug_factory'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import skipData from '../helpers/pagination.js'

export default class DrugFactoriesController {
  async addDrugFactory({ request, response, auth }: HttpContext) {
    try {
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
      }
    }
  }

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

  async getFactoryDetail({ response, params, auth }: HttpContext) {
    try {
      const factoryData = await db.rawQuery(
        `SELECT
          df.id,
          df.factory_name,
          df.factory_email,
          df.factory_phone,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", d.id,
                "created_at", DATE_FORMAT(d.created_at, "%Y-%m-%d"),
                "drug", d.drug,
                "drug_generic_name", d.drug_generic_name,
                "unit", d.unit_name,
                "composition", d.composition,
                "category_name", dc.category_name,
                "purchase_price", d.purchase_price,
                "selling_price", d.selling_price,
                "total_stock", d.total_stock
              )
            ),
            "]"
          ) AS drug_list
          FROM drug_factories df
          INNER JOIN drugs d ON df.id = d.drug_factory_id AND d.clinic_id = ?
          INNER JOIN drug_categories dc ON dc.id = d.drug_category_id
          WHERE df.id = ?`,
        [auth.user!.clinicId, params.id]
      )

      if (factoryData[0].length === 0) {
        throw new DataNotFoundException('Drug factory data not found!')
      }

      Object.assign(factoryData[0][0], {
        drug_list: JSON.parse(factoryData[0][0].drug_list),
      })

      return response.ok({ message: 'Data fetched!', data: factoryData[0][0] })
    } catch (error) {
      throw error
    }
  }
}
