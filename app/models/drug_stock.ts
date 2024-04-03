import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Drug from './drug.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PurchaseShoppingCart from './purchase_shopping_cart.js'
import SellingShoppingCart from './selling_shopping_cart.js'

export default class DrugStock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare batchNumber: string

  @column()
  declare totalStock: number

  @column()
  declare soldStock: number

  @column()
  declare activeStock: number

  @column.date()
  declare expired: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare drugId: number

  @column()
  declare purchaseShoppingCartId?: number

  @belongsTo(() => Drug)
  declare drug: BelongsTo<typeof Drug>

  @belongsTo(() => PurchaseShoppingCart)
  declare purchaseShoppingCart: BelongsTo<typeof PurchaseShoppingCart>

  static async reduceStockOnSelling(cart: SellingShoppingCart) {
    let remainingQuantity = cart.quantity

    const stockData = await this.query()
      .where('drug_id', cart.drugId!)
      .andWhere('active_stock', '>', 0)
      .orderBy('created_at', 'asc')

    for (const stock of stockData) {
      const quantityToReduce = Math.min(stock.activeStock, remainingQuantity)

      await stock
        .merge({
          activeStock: stock.activeStock - quantityToReduce,
          soldStock: stock.soldStock + quantityToReduce,
        })
        .save()

      remainingQuantity -= quantityToReduce

      if (remainingQuantity <= 0) break
    }

    await Drug.query().where('id', cart.drugId!).decrement('total_stock', cart.quantity)
  }
}
