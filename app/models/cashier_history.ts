import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { Cashier } from '../enums/cashier_enum.js'
import Clinic from './clinic.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CashierHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare status: Cashier

  @column()
  declare openBy: string

  @column()
  declare closeBy: string

  @column.dateTime()
  declare openCashierAt: DateTime

  @column.dateTime()
  declare closeCashierAt: DateTime

  @column()
  declare clinicId: number

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>
}
