import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Drug from './drug.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Unit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare unitName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => Drug)
  declare drugs: HasMany<typeof Drug>
}
