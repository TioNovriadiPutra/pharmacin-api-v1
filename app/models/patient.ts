import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { Gender } from '../enums/gender_enum.js'
import Clinic from './clinic.js'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Occupation from './occupation.js'
import Queue from './queue.js'
import Record from './record.js'
import SellingTransaction from './selling_transaction.js'

export default class Patient extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nik: string

  @column()
  declare fullName: string

  @column()
  declare address: string

  @column()
  declare recordNumber: string

  @column()
  declare gender: Gender

  @column()
  declare pob: string

  @column.date()
  declare dob: DateTime

  @column()
  declare alamatPasien: string

  @column()
  declare phone: string

  @column()
  declare occupationName: string

  @column()
  declare allergy?: string

  @column({
    serialize: (value: number) => {
      return Boolean(value)
    },
  })
  declare ready: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare clinicId: number

  @column()
  declare occupationId?: number

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>

  @belongsTo(() => Occupation)
  declare occupation: BelongsTo<typeof Occupation>

  @hasOne(() => Queue)
  declare queue: HasOne<typeof Queue>

  @hasMany(() => Record)
  declare records: HasMany<typeof Record>

  @hasMany(() => SellingTransaction)
  declare sellingTransactions: HasMany<typeof SellingTransaction>
}
