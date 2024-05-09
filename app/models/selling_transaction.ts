import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Record from './record.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Clinic from './clinic.js'
import Patient from './patient.js'
import SellingShoppingCart from './selling_shopping_cart.js'
import Queue from './queue.js'
import ActionCart from './action_cart.js'

export default class SellingTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceNumber: string

  @column()
  declare registrationNumber: string

  @column()
  declare totalPrice: number

  @column({
    serialize: (value: number) => {
      return Boolean(value)
    },
  })
  declare status: boolean

  @column({
    serialize: (value: Number) => {
      return Boolean(value)
    },
  })
  declare pickUpStatus: boolean

  @column()
  declare subTotalPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare recordId: number

  @column()
  declare clinicId: number

  @column()
  declare patientId: number

  @column()
  declare queueId?: number

  @belongsTo(() => Record)
  declare record: BelongsTo<typeof Record>

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>

  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @hasMany(() => SellingShoppingCart)
  declare sellingShoppingCarts: HasMany<typeof SellingShoppingCart>

  @belongsTo(() => Queue)
  declare queue: BelongsTo<typeof Queue>

  @hasMany(() => ActionCart)
  declare actionCarts: HasMany<typeof ActionCart>
}
