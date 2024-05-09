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
import ActionCart from '#models/action_cart'
import Queue from '#models/queue'
import { QueueStatus } from '../enums/queue_enum.js'
import Patient from '#models/patient'
import BadRequestException from '#exceptions/bad_request_exception'

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
  async getSellingTransactionDetail({ response, bouncer, params }: HttpContext) {
    try {
      const transactionData = await db.rawQuery(
        `SELECT
          st.id,
          st.registration_number,
          p.record_number,
          p.full_name,
          CONCAT(p.pob, ", ", DATE_FORMAT(p.dob, "%d %M %Y")) AS ttl,
          p.address,
          DATE_FORMAT(st.created_at, "%d-%m-%Y") AS tgl_periksa,
          r.doctor_name,
          p.allergy,
          c.outpatient_fee,
          st.total_price,
          st.sub_total_price,
          CASE
            WHEN st.status = 0 THEN "Belum Dibayar"
            WHEN st.status = 1 THEN "Sudah Dibayar"
          END AS status,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", ssc.id,
                "drug_name", ssc.drug_name,
                "quantity", ssc.quantity,
                "unit_name", ssc.unit_name,
                "instruction", ssc.instruction,
                "total_price", ssc.total_price
              )
            ),
            "]"
          ) AS drug_carts,
          CAST(SUM(ssc.total_price) AS SIGNED) AS drug_carts_total_price,
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
          CAST(SUM(ac.action_price) AS SIGNED) AS action_carts_total_price,
          st.clinic_id AS clinicId
         FROM selling_transactions st
         JOIN patients p ON st.patient_id = p.id
         JOIN records r ON st.record_id = r.id
         JOIN clinics c ON st.clinic_id = c.id
         LEFT JOIN selling_shopping_carts ssc ON st.id = ssc.selling_transaction_id
         LEFT JOIN action_carts ac ON st.id = ac.selling_transaction_id
         WHERE st.id = ?
         GROUP BY st.id`,
        [params.id]
      )

      if (transactionData[0].length === 0) {
        throw new DataNotFoundException('Data penjualan tidak ditemukan!')
      }

      if (
        await bouncer.with('TransactionPolicy').denies('viewQueueDetail', transactionData[0][0])
      ) {
        throw new ForbiddenException()
      }

      delete transactionData[0][0].clinicId

      Object.assign(transactionData[0][0], {
        drug_carts: JSON.parse(transactionData[0][0].drug_carts).some(
          (cart: any) => cart.id === null
        )
          ? []
          : JSON.parse(transactionData[0][0].drug_carts),
        drug_carts_total_price: transactionData[0][0].drug_carts_total_price || 0,
        action_carts: JSON.parse(transactionData[0][0].action_carts).some(
          (cart: any) => cart.id === null
        )
          ? []
          : JSON.parse(transactionData[0][0].action_carts),
        action_carts_total_price: transactionData[0][0].action_carts_total_price || 0,
      })

      return response.ok({
        message: 'Data fetched!',
        data: transactionData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async getPharmacyTransactionDetail({ response, bouncer, params }: HttpContext) {
    try {
      const transactionData = await db.rawQuery(
        `SELECT
          st.id,
          st.registration_number,
          p.record_number,
          p.full_name,
          CONCAT(p.pob, ", ", DATE_FORMAT(p.dob, "%d %M %Y")) AS ttl,
          p.address,
          DATE_FORMAT(st.created_at, "%d-%m-%Y") AS tgl_periksa,
          r.doctor_name,
          p.allergy,
          CASE
            WHEN st.pick_up_status = 0 THEN "Belum Diserahkan"
            WHEN st.pick_up_status = 1 THEN "Obat Diserahkan"
          END AS status,
          CONCAT(
            "[",
            GROUP_CONCAT(
              JSON_OBJECT(
                "id", ssc.id,
                "drug_name", ssc.drug_name,
                "quantity", ssc.quantity,
                "unit_name", ssc.unit_name,
                "instruction", ssc.instruction,
                "total_price", ssc.total_price
              )
            ),
            "]"
          ) AS drug_carts,
          CAST(SUM(ssc.total_price) AS SIGNED) AS drug_carts_total_price,
          st.clinic_id AS clinicId
         FROM selling_transactions st
         JOIN patients p ON st.patient_id = p.id
         JOIN records r ON st.record_id = r.id
         LEFT JOIN selling_shopping_carts ssc ON st.id = ssc.selling_transaction_id
         WHERE st.id = ?
         GROUP BY st.id`,
        [params.id]
      )

      if (transactionData[0].length === 0) {
        throw new DataNotFoundException('Data penjualan tidak ditemukan!')
      }

      if (
        await bouncer.with('TransactionPolicy').denies('viewQueueDetail', transactionData[0][0])
      ) {
        throw new ForbiddenException()
      }

      delete transactionData[0][0].clinicId

      Object.assign(transactionData[0][0], {
        drug_carts: JSON.parse(transactionData[0][0].drug_carts).some(
          (cart: any) => cart.id === null
        )
          ? []
          : JSON.parse(transactionData[0][0].drug_carts),
        drug_carts_total_price: transactionData[0][0].drug_carts_total_price || 0,
      })

      return response.ok({
        message: 'Data fetched!',
        data: transactionData[0][0],
      })
    } catch (error) {
      throw error
    }
  }

  async sellingTransactionPayment({ response, params, bouncer }: HttpContext) {
    let transactionData = null
    let queueData = null
    let drugData = null
    let drugStockData = null

    let drugArr = []
    let drugStockArr = []

    try {
      transactionData = await SellingTransaction.query()
        .preload('sellingShoppingCarts')
        .where('id', params.id)
        .firstOrFail()
      queueData = await Queue.findOrFail(transactionData.queueId)

      if (await bouncer.with('TransactionPolicy').denies('handleCart', transactionData)) {
        throw new ForbiddenException()
      }

      if (transactionData.sellingShoppingCarts.length > 0) {
        for (const cart of transactionData.sellingShoppingCarts) {
          drugData = await Drug.findOrFail(cart.drugId)
          drugData.totalStock = drugData.totalStock - cart.quantity

          drugArr.push(drugData)

          drugStockData = await DrugStock.query()
            .where('drug_id', drugData.id)
            .andWhere('active_stock', '>', 0)
            .orderBy('created_at', 'asc')

          let remain = cart.quantity

          for (const stock of drugStockData) {
            if (remain > 0) {
              if (stock.activeStock < remain) {
                remain -= stock.activeStock
                stock.soldStock = stock.totalStock
                stock.activeStock = 0
              } else {
                stock.soldStock = stock.soldStock + remain
                stock.activeStock = stock.activeStock - remain
                remain = 0
              }

              drugStockArr.push(stock)
            } else {
              break
            }
          }
        }
      }

      transactionData.status = true

      queueData.status = QueueStatus['DRUG_PICK_UP']

      await transactionData.save()
      await queueData.save()

      for (const drug of drugArr) {
        await drug.save()
      }

      for (const stock of drugStockArr) {
        await stock.save()
      }

      return response.ok({
        message: 'Pembayaran berhasil!',
      })
    } catch (error) {
      if (error.status === 404) {
        if (transactionData) {
          throw new DataNotFoundException('Data antrian tidak ditemukan!')
        } else {
          throw new DataNotFoundException('Data penjualan tidak ditemukan!')
        }
      } else {
        throw error
      }
    }
  }

  async pharmacyTransactionDrugDelivery({ response, bouncer, params }: HttpContext) {
    try {
      const transactionData = await SellingTransaction.findOrFail(params.id)
      const queueData = await Queue.findOrFail(transactionData.queueId)
      const patientData = await Patient.findOrFail(queueData.patientId)

      if (await bouncer.with('TransactionPolicy').denies('handlePharmacy', transactionData)) {
        throw new ForbiddenException()
      }

      if (queueData.status === QueueStatus['PAYMENT']) {
        throw new BadRequestException('Pesanan belum dibayar!')
      }

      transactionData.pickUpStatus = true
      queueData.status = QueueStatus['DONE']
      patientData.ready = true

      await transactionData.save()
      await queueData.save()
      await patientData.save()

      return response.ok({
        message: 'Obat diserahkan!',
      })
    } catch (error) {
      throw error
    }
  }

  async deleteSellingShoppingCartItem({ response, bouncer, params }: HttpContext) {
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

  async deleteActionCartItem({ response, bouncer, params }: HttpContext) {
    try {
      const cartData = await ActionCart.findOrFail(params.id)
      const transactionData = await SellingTransaction.findOrFail(cartData.sellingTransactionId)

      if (await bouncer.with('TransactionPolicy').denies('handleCart', transactionData)) {
        throw new ForbiddenException()
      }

      transactionData.totalPrice = transactionData.totalPrice - cartData.actionPrice

      await transactionData.save()
      await cartData.delete()

      return response.ok({
        message: 'Keranjang tindakan berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data tindakan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
