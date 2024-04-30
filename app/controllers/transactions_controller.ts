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
import SellingShoppingCart from '#models/selling_shopping_cart'
import SellingTransaction from '#models/selling_transaction'

export default class TransactionsController {
  // Purchase Transaction
  async getPurchaseTransactions({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('TransactionPolicy').denies('view')) {
        throw new ForbiddenException()
      }

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
          DATE_FORMAT(pt.created_at, "%d-%m-%Y") AS created_at
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
      throw error
    }
  }

  async getPurchaseTransactionDetail({ response, bouncer, params }: HttpContext) {
    try {
      const transactionData = await db.rawQuery(
        `SELECT
          pt.id,
          pt.invoice_number,
          pt.total_price,
          pt.factory_name,
          DATE_FORMAT(pt.created_at, "%d-%m-%Y, %H:%i") AS created_at,
          pt.clinic_id AS clinicId,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", psc.id,
                "drug_name", psc.drug_name,
                "expired", DATE_FORMAT(psc.expired, "%d-%m-%Y"),
                "quantity", psc.quantity,
                "purchase_price", psc.purchase_price,
                "total_price", psc.total_price
              )
            ),
            "]"
          ) AS shopping_carts
         FROM purchase_transactions pt
         JOIN purchase_shopping_carts psc ON pt.id = psc.purchase_transaction_id
         WHERE pt.id = ?`,
        [params.id]
      )

      if (transactionData[0].length === 0) {
        throw new DataNotFoundException('Data pembelian tidak ditemukan!')
      }

      if (
        await bouncer.with('TransactionPolicy').denies('viewDetailPurchase', transactionData[0][0])
      ) {
        throw new ForbiddenException()
      }

      Object.assign(transactionData[0][0], {
        shopping_carts: JSON.parse(transactionData[0][0].shopping_carts),
      })

      return response.ok({
        message: 'Data fetched!',
        data: transactionData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async addPurchaseTransaction({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('TransactionPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addPurchaseTransactionValidator)

      const factoryData = await DrugFactory.findOrFail(data.factoryId)

      const invoiceDate = DateTime.now()

      const newPurchaseTransaction = new PurchaseTransaction()
      newPurchaseTransaction.totalPrice = data.totalPrice
      newPurchaseTransaction.factoryName = factoryData.factoryName
      newPurchaseTransaction.factoryEmail = factoryData.factoryEmail
      newPurchaseTransaction.factoryPhone = factoryData.factoryPhone
      newPurchaseTransaction.clinicId = auth.user!.clinicId

      await factoryData.related('purchaseTransactions').save(newPurchaseTransaction)

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

        const newDrugStock = new DrugStock()
        newDrugStock.totalStock = item.quantity
        newDrugStock.activeStock = item.quantity
        newDrugStock.expired = DateTime.fromISO(item.expired)
        newDrugStock.drugId = drugData.id

        await drugData.related('purchaseShoppingCarts').save(newPurchaseShoppingCart)
        await newPurchaseShoppingCart.related('drugStock').save(newDrugStock)

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
      } else {
        throw error
      }
    }
  }

  // Selling Transaction
  async getSellingTransactionsQueue({ response, bouncer, auth }: HttpContext) {
    try {
      if (await bouncer.with('TransactionPolicy').denies('viewQueue')) {
        throw new ForbiddenException()
      }

      const sellingTransactionData = await db.rawQuery(
        `SELECT
          st.id,
          p.full_name,
          p.record_number,
          st.registration_number,
          CASE
            WHEN st.status = 0 THEN 'Belum Dibayar'
            WHEN st.status = 1 THEN 'Sudah Dibayar'
          END AS payment_status
         FROM selling_transactions st
         JOIN patients p ON st.patient_id = p.id
         WHERE st.clinic_id = ? AND DATE(st.created_at) = CURDATE()
         ORDER BY st.status ASC, st.created_at ASC`,
        [auth.user!.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: sellingTransactionData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async getSellingTransactionDetail({ response, bouncer, params }: HttpContext) {
    try {
      const sellingTransactionData = await db.rawQuery(
        `SELECT
          st.id,
          CASE
            WHEN st.status = 0 THEN 'Belum Dibayar'
            WHEN st.status = 1 THEN 'Sudah Dibayar'
          END AS payment_status,
          st.registration_number,
          p.record_number,
          p.full_name,
          CONCAT(p.pob, ", ", DATE_FORMAT(p.dob, "%d %M %Y")) AS ttl,
          p.address,
          DATE_FORMAT(st.created_at, "%d-%m-%Y") AS created_at,
          r.doctor_name,
          p.allergy,
          st.total_price AS sub_total,
          c.selling_fee,
          st.total_price + c.selling_fee AS total,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", ssc.drug_name,
                "quantity", ssc.quantity,
                "unit_name", ssc.unit_name,
                "instruction", ssc.instruction,
                "sub_total", ssc.total_price
              )
            ),
            "]"
          ) AS drug_carts,
          CAST(SUM(ssc.total_price) AS SIGNED) AS total_drug_carts,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", ac.id,
                "action_name", ac.action_name,
                "action_price", ac.action_price
              )
            ),
            "]"
          ) AS action_carts,
          CAST(SUM(ac.action_price) AS SIGNED) AS total_action_carts,
          st.clinic_id
         FROM selling_transactions st
         JOIN patients p ON st.patient_id = p.id
         JOIN records r ON st.record_id = r.id
         JOIN clinics c ON st.clinic_id = c.id
         JOIN selling_shopping_carts ssc ON st.id = ssc.selling_transaction_id
         JOIN action_carts ac ON st.id = ac.selling_transaction_id
         WHERE st.id = ?`,
        [params.id]
      )

      if (sellingTransactionData[0].length === 0) {
        throw new DataNotFoundException('Data penjualan tidak ditemukan!')
      }

      Object.assign(sellingTransactionData[0][0], {
        drug_carts: JSON.parse(sellingTransactionData[0][0].drug_carts),
        action_carts: JSON.parse(sellingTransactionData[0][0].action_carts),
      })

      if (
        await bouncer.with('TransactionPolicy').denies('handleCart', sellingTransactionData[0][0])
      ) {
        throw new ForbiddenException()
      }

      return response.ok({
        message: 'Data fetched!',
        data: sellingTransactionData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async sellingPayment({ response, bouncer, params }: HttpContext) {
    try {
      const sellingTransactionData = await SellingTransaction.findOrFail(params.id)
      const sellingShoppingCartData = await SellingShoppingCart.query().where(
        'selling_transaction_id',
        sellingTransactionData.id
      )

      if (await bouncer.with('TransactionPolicy').denies('handleCart', sellingTransactionData)) {
        throw new ForbiddenException()
      }

      for (const cart of sellingShoppingCartData) {
        await DrugStock.reduceStockOnSelling(cart)
      }

      await sellingTransactionData.merge({ status: true }).save()

      return response.ok({
        message: 'Penjualan berhasil!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data transaksi tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteSellingShoppingCart({ response, bouncer, params }: HttpContext) {
    try {
      const cartData = await SellingShoppingCart.findOrFail(params.id)
      const transactionData = await SellingTransaction.findOrFail(cartData.sellingTransactionId)

      if (await bouncer.with('TransactionPolicy').denies('handleCart', transactionData)) {
        throw new ForbiddenException()
      }

      transactionData.totalPrice = transactionData.totalPrice - cartData.totalPrice

      await transactionData.save()
      await cartData.delete()

      return response.ok({
        message: 'Keranjang obat berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data obat tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
