import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Clinic from './clinic.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ActionCart from './action_cart.js'

export default class Action extends BaseModel {
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
  declare clinicId: number

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>

  @hasMany(() => ActionCart)
  declare actionCarts: HasMany<typeof ActionCart>
}
