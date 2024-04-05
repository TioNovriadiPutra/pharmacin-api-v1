import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Action from './action.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellingTransaction from './selling_transaction.js'

export default class ActionCart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare actionName: string

  @column()
  declare actionPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare actionId?: number

  @column()
  declare sellingTransactionId: number

  @belongsTo(() => Action)
  declare action: BelongsTo<typeof Action>

  @belongsTo(() => SellingTransaction)
  declare sellingTransaction: BelongsTo<typeof SellingTransaction>
}
