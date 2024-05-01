import DataNotFoundException from '#exceptions/data_not_found_exception'
import ValidationException from '#exceptions/validation_exception'
import Drug from '#models/drug'
import DrugCategory from '#models/drug_category'
import { addDrugCategoryValidator, addDrugValidator } from '#validators/drug'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import idConverter from '../helpers/id_converter.js'
import skipData from '../helpers/pagination.js'
import Unit from '#models/unit'
import ForbiddenException from '#exceptions/forbidden_exception'
import DrugFactory from '#models/drug_factory'

export default class DrugsController {
  // Drug Category Service
  async getDrugCategories({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugCategoryPolicy').denies('viewAndAdd')) {
        throw new ForbiddenException()
      }

      // const page = request.input('page', 1)
      // const perPage = request.input('perPage', 10)
      // const searchTerm = request.input('searchTerm', '')
      // const search = `%${searchTerm}%`
      const categoryData = await db.rawQuery(
        `SELECT 
          id,
          category_number,
          category_name 
         FROM drug_categories 
         WHERE clinic_id = ?`,
        [auth.user!.clinicId]
      )

      // , search, perPage, skipData(page, perPage)

      return response.ok({ message: 'Data fetched!', data: categoryData[0] })
    } catch (error) {
      throw error
    }
  }

  async getDrugCategoryDetail({ response, params, bouncer }: HttpContext) {
    try {
      const categoryData = await DrugCategory.query()
        .select('id', 'category_name', 'clinic_id')
        .where('id', params.id)
        .firstOrFail()

      if (await bouncer.with('DrugCategoryPolicy').denies('update', categoryData)) {
        throw new ForbiddenException()
      }

      return response.ok({ message: 'Data fetched!', data: categoryData })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data kategori tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async addDrugCategory({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugCategoryPolicy').denies('viewAndAdd')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addDrugCategoryValidator)

      const newDrugCategory = new DrugCategory()
      newDrugCategory.categoryName = data.categoryName
      newDrugCategory.clinicId = auth.user!.clinicId

      await newDrugCategory.save()

      newDrugCategory.categoryNumber = `KTO${idConverter(newDrugCategory.id)}`

      await newDrugCategory.save()

      return response.created({ message: 'Kategori obat berhasil ditambahkan!' })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else {
        throw error
      }
    }
  }

  async updateDrugCategory({ request, response, params, bouncer }: HttpContext) {
    try {
      const categoryData = await DrugCategory.findOrFail(params.id)

      if (await bouncer.with('DrugCategoryPolicy').denies('update', categoryData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addDrugCategoryValidator)

      categoryData.categoryName = data.categoryName

      await categoryData.save()

      return response.ok({ message: 'Data kategori berhasil diubah!' })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data kategori tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteDrugCategory({ response, params, bouncer }: HttpContext) {
    try {
      const categoryData = await DrugCategory.findOrFail(params.id)

      if (await bouncer.with('DrugCategoryPolicy').denies('update', categoryData)) {
        throw new ForbiddenException()
      }

      await categoryData.delete()

      return response.ok({ message: 'Data kategori berhasil dihapus!' })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data kategori tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  // Drug Service
  async getDrugs({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const page = request.input('page', 1)
      const perPage = request.input('perPage', 10)
      const searchTerm = request.input('searchTerm', '')
      const search = `%${searchTerm}%`
      const drugData = await db.rawQuery(
        `SELECT 
        drugs.id,
        drugs.drug, 
        drugs.drug_generic_name, 
        drug_categories.category_name, 
        drugs.shelve, 
        drugs.selling_price, 
        drugs.composition 
        FROM drugs 
        JOIN drug_categories ON drugs.drug_category_id = drug_categories.id 
        WHERE drugs.clinic_id = ?
        AND (drugs.drug LIKE ? OR drugs.drug_generic_name LIKE ? OR drugs.shelve LIKE ? OR drug_categories.category_name LIKE ?)
        LIMIT ?
        OFFSET ?`,
        [auth.user!.clinicId, search, search, search, search, perPage, skipData(page, perPage)]
      )

      return response.ok({ message: 'Data fetched!', data: drugData[0] })
    } catch (error) {
      throw error
    }
  }

  async getDrugDetail({ response, params, bouncer }: HttpContext) {
    try {
      const drugData = await Drug.query()
        .select(
          'id',
          'drug_number',
          'drug',
          'drug_generic_name',
          'unit_name',
          'composition',
          'shelve',
          'purchase_price',
          'selling_price',
          'total_stock',
          'drug_category_id',
          'drug_factory_id',
          'clinic_id',
          'unit_id'
        )
        .preload('drugCategory', (builder) => {
          builder.select('id', 'category_name')
        })
        .preload('drugFactory', (builder2) => {
          builder2.select('id', 'factory_name')
        })
        .preload('unit', (builder3) => {
          builder3.select('id', 'unit_name')
        })
        .where('id', params.id)
        .firstOrFail()

      if (await bouncer.with('DrugPolicy').denies('update', drugData)) {
        throw new ForbiddenException()
      }

      return response.ok({ message: 'Data fetched!', data: drugData })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data obat tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async getDrugByDrugFactory({ response, params, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const drugFactoryData = await DrugFactory.findOrFail(params.id)

      const drugData = await db.rawQuery(
        `SELECT
          id,
          drug,
          purchase_price
         FROM drugs
         WHERE drug_factory_id = ? AND clinic_id = ?`,
        [drugFactoryData.id, auth.user!.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: drugData[0],
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data pabrik tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async getDrugsAssessment({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const drugData = await db.rawQuery(
        `SELECT
          id,
          drug,
          unit_name,
          selling_price
         FROM drugs
         WHERE clinic_id = ? AND total_stock > 0`,
        [auth.user?.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: drugData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async addDrug({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('DrugPolicy').denies('add')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addDrugValidator)

      const unitData = await Unit.findOrFail(data.unitId)

      const newDrug = new Drug()
      newDrug.drug = data.drug
      newDrug.drugGenericName = data.drugGenericName
      newDrug.composition = data.composition
      newDrug.unitName = unitData.unitName
      newDrug.shelve = data.shelve
      newDrug.purchasePrice = data.purchasePrice
      newDrug.sellingPrice = data.sellingPrice
      newDrug.drugCategoryId = data.categoryId
      newDrug.drugFactoryId = data.factoryId
      newDrug.clinicId = auth.user!.clinicId
      newDrug.unitId = data.unitId

      await newDrug.save()

      newDrug.drugNumber = `OBT${idConverter(newDrug.id)}`

      await newDrug.save()

      return response.created({ message: 'Obat berhasil ditambahkan!' })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data unit tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async updateDrug({ request, response, params, bouncer }: HttpContext) {
    try {
      const drugData = await Drug.findOrFail(params.id)

      if (await bouncer.with('DrugPolicy').denies('update', drugData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addDrugValidator)

      const unitData = await Unit.findOrFail(data.unitId)

      drugData.drug = data.drug
      drugData.drugGenericName = data.drugGenericName
      drugData.composition = data.composition
      drugData.unitName = unitData.unitName
      drugData.drugCategoryId = data.categoryId
      drugData.drugFactoryId = data.factoryId
      drugData.shelve = data.shelve
      drugData.purchasePrice = data.purchasePrice
      drugData.sellingPrice = data.sellingPrice
      drugData.unitId = data.unitId

      await drugData.save()

      return response.ok({ message: 'Data obat berhasil diubah!' })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data obat tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteDrug({ response, params, bouncer }: HttpContext) {
    try {
      const drugData = await Drug.findOrFail(params.id)

      if (await bouncer.with('DrugPolicy').denies('delete', drugData)) {
        throw new ForbiddenException()
      }

      await drugData.delete()

      return response.ok({ message: 'Data obat berhasil dihapus!' })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data obat tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
