import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { addPurchaseTransactionValidator } from '#validators/transaction'
import PurchaseTransaction from '#models/purchase_transaction'
import PurchaseShoppingCart from '#models/purchase_shopping_cart'
import DrugStock from '#models/drug_stock'
import Drug from '#models/drug'
import DrugFactory from '#models/drug_factory'
import { DateTime } from 'luxon'
import idConverter from '../helpers/id_converter.js'
import ValidationException from '#exceptions/validation_exception'
import DataNotFoundException from '#exceptions/data_not_found_exception'
import skipData from '../helpers/pagination.js'
import ForbiddenException from '#exceptions/forbidden_exception'

export default class TransactionsController {
  async getPurchaseTransactions({ request, response, auth }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('perPage', 20)
      const searchTerm = request.input('searchTerm', '')
      const search = `%${searchTerm}%`

      const purchaseDataList = await db.rawQuery(
        `SELECT
          pt.id,
          pt.invoice_number,
          pt.total_price,
          df.factory_name,
          DATE_FORMAT(pt.created_at, "%Y-%m-%d") AS created_at
          FROM purchase_transactions pt
          JOIN drug_factories df ON pt.drug_factory_id = df.id
          WHERE pt.clinic_id = ? AND (pt.invoice_number LIKE ? OR df.factory_name LIKE ?)
          ORDER BY pt.created_at DESC
          LIMIT ? OFFSET ?`,
        [auth.user!.clinicId, search, search, perPage, skipData(page, perPage)]
      )

      return response.ok({
        message: 'Data fetched!',
        data: purchaseDataList[0],
      })
    } catch (error) {
      return response.badRequest({
        message: 'ERROR',
        error: error,
      })
    }
  }

  async getPurchaseTransactionDetail({ response, bouncer, auth, params }: HttpContext) {
    try {
      if (await bouncer.with('TransactionPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const invoiceData = await db.rawQuery(
        `SELECT
          pt.invoice_number,
          df.factory_name,
          DATE_FORMAT(pt.created_at, '%Y-%m-%d, %H:%i:%s') AS transaction_date,
          JSON_ARRAY(
            JSON_OBJECT(
              'drug', psc.drug_name,
              'expired', DATE_FORMAT(psc.expired, '%Y-%m-%d'),
              'quantity', psc.quantity,
              'purchase_price', psc.purchase_price,
              'total_price', psc.total_price
            )
          ) AS shopping_carts,
          pt.total_price
         FROM purchase_transactions pt
         JOIN drug_factories df ON pt.drug_factory_id = df.id
         JOIN purchase_shopping_carts psc ON psc.purchase_transaction_id = pt.id
         WHERE pt.id = ? AND pt.clinic_id = ?`,
        [params.id, auth.user!.clinicId]
      )

      if (invoiceData[0].length === 0) {
        throw new DataNotFoundException('Data transaksi tidak ditemukan!')
      }

      Object.assign(invoiceData[0][0], {
        shopping_carts: JSON.parse(invoiceData[0][0].shopping_carts),
      })

      return response.ok({
        message: 'Data fetched!',
        data: invoiceData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async getSellingTransactionDetail({ response, bouncer, params }: HttpContext) {
    try {
      if (await bouncer.with('TransactionPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const transactionData = await db.rawQuery(
        `SELECT
          q.id,
          q.registration_number,
          p.record_number,
          p.full_name,
          CONCAT(p.pob, ", ", p.dob) AS ttl,
          p.address,
          DATE_FORMAT(q.created_at, "%Y-%m-%d") AS created_at,
          r.doctor_name,
          p.allergy,
          CASE
            WHEN st.status = 0 THEN "Belum Diproses"
            WHEN st.status = 1 THEN "Sudah Diproses"
          END AS status,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "drug_name", ssc.drug_name,
                "quantity", ssc.quantity,
                "unit_name", ssc.unit_name,
                "instruction", ssc.instruction,
                "total_price", ssc.total_price
              ) ORDER BY ssc.id SEPARATOR ','
            ),
            "]"
          ) AS drug_carts,
          st.total_price
         FROM queues q
         JOIN patients p ON q.patient_id = p.id
         JOIN selling_transactions st ON q.id = st.queue_id
         JOIN records r ON st.record_id = r.id
         JOIN selling_shopping_carts ssc ON st.id = ssc.selling_transaction_id
         WHERE q.id = ?`,
        [params.id]
      )

      if (transactionData[0].length === 0) {
        throw new DataNotFoundException('Data transaksi tidak ditemukan!')
      }

      Object.assign(transactionData[0][0], {
        drug_carts: JSON.parse(transactionData[0][0].drug_carts),
      })

      return response.ok({
        message: 'Data fetched!',
        data: transactionData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async addPurchaseTransaction({ request, response, auth }: HttpContext) {
    try {
      const data = await request.validateUsing(addPurchaseTransactionValidator)

      const factoryData = await DrugFactory.findOrFail(data.factoryId)

      const invoiceDate = DateTime.now()

      const newPurchaseTransaction = new PurchaseTransaction()
      newPurchaseTransaction.totalPrice = data.totalPrice
      newPurchaseTransaction.factoryName = factoryData.factoryName
      newPurchaseTransaction.factoryEmail = factoryData.factoryEmail
      newPurchaseTransaction.factoryPhone = factoryData.factoryPhone
      newPurchaseTransaction.clinicId = auth.user!.clinicId
      newPurchaseTransaction.drugFactoryId = data.factoryId

      await newPurchaseTransaction.save()

      newPurchaseTransaction.invoiceNumber = `INV/${invoiceDate.year}${invoiceDate.month}${invoiceDate.day}/${idConverter(newPurchaseTransaction.id)}`

      await newPurchaseTransaction.save()

      data.purchaseItems.forEach(async (item) => {
        const drugData = await Drug.findOrFail(item.drugId)
        drugData.totalStock = drugData.totalStock + item.quantity

        const newPurchaseShoppingCart = new PurchaseShoppingCart()
        newPurchaseShoppingCart.expired = DateTime.fromISO(item.expired)
        newPurchaseShoppingCart.quantity = item.quantity
        newPurchaseShoppingCart.totalPrice = item.totalPrice
        newPurchaseShoppingCart.drugName = drugData.drug
        newPurchaseShoppingCart.purchasePrice = drugData.purchasePrice
        newPurchaseShoppingCart.purchaseTransactionId = newPurchaseTransaction.id
        newPurchaseShoppingCart.drugId = item.drugId

        await newPurchaseShoppingCart.save()

        const newDrugStock = new DrugStock()
        newDrugStock.totalStock = item.quantity
        newDrugStock.activeStock = item.quantity
        newDrugStock.expired = DateTime.fromISO(item.expired)
        newDrugStock.drugId = item.drugId
        newDrugStock.purchaseShoppingCartId = newPurchaseShoppingCart.id

        await drugData.save()
        await newDrugStock.save()

        newDrugStock.batchNumber = `BN${invoiceDate.year}${invoiceDate.month}${invoiceDate.day}${idConverter(newDrugStock.id)}`

        await newDrugStock.save()
      })

      return response.created({
        message: 'Pembelian obat berhasil!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data pabrik atau obat tidak ditemukan!')
      }
    }
  }

  async deletePurchaseTransaction({ response, params }: HttpContext) {
    try {
      const purchaseTransactionData = await PurchaseTransaction.findOrFail(params.id)

      await purchaseTransactionData.delete()

      return response.ok({
        message: 'Data pembelian berhasil dihapus!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data pembelian tidak ditemukan!')
      }
    }
  }
}
