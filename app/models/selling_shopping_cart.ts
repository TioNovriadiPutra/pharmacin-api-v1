import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import SellingTransaction from './selling_transaction.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Drug from './drug.js'

export default class SellingShoppingCart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare drugName: string

  @column()
  declare sellingPrice: number

  @column()
  declare instruction: string

  @column()
  declare unitName: string

  @column()
  declare quantity: number

  @column()
  declare totalPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare sellingTransactionId: number

  @column()
  declare drugId?: number

  @belongsTo(() => SellingTransaction)
  declare sellingTransaction: BelongsTo<typeof SellingTransaction>

  @belongsTo(() => Drug)
  declare drug: BelongsTo<typeof Drug>
}
