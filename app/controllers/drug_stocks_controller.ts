import ForbiddenException from '#exceptions/forbidden_exception'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class DrugStocksController {
  async getStocks({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('StockPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const stockPerItemData = await db.rawQuery(
        `SELECT
        drugs.id,
        drugs.drug,
        drug_factories.factory_name,
        drug_categories.category_name,
        drugs.purchase_price,
        drugs.selling_price,
        drugs.total_stock
        FROM drugs
        JOIN drug_categories ON drugs.drug_category_id = drug_categories.id
        JOIN drug_factories ON drugs.drug_factory_id = drug_factories.id
        WHERE drugs.clinic_id = ?`,
        [auth.user!.clinicId]
      )

      const stockPerBatchData = await db.rawQuery(
        `SELECT
        drug_stocks.id,
        drugs.drug,
        drug_factories.factory_name,
        drug_stocks.batch_number,
        DATE_FORMAT(drug_stocks.expired, "%Y-%m-%d") AS expired,
        drug_stocks.total_stock,
        drug_stocks.sold_stock,
        drug_stocks.active_stock
        FROM drugs
        JOIN drug_stocks ON drug_stocks.drug_id = drugs.id
        JOIN drug_categories ON drugs.drug_category_id = drug_categories.id
        JOIN drug_factories ON drugs.drug_factory_id = drug_factories.id
        WHERE drugs.clinic_id = ?`,
        [auth.user!.clinicId]
      )

      const stockData = {
        perItem: stockPerItemData[0],
        perBatch: stockPerBatchData[0],
      }

      return response.ok({
        message: 'Data fetched!',
        data: stockData,
      })
    } catch (error) {
      throw error
    }
  }
}
