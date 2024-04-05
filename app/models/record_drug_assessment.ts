import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Drug from './drug.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Record from './record.js'

export default class RecordDrugAssessment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare drugName: string

  @column()
  declare unitName: string

  @column()
  declare instruction: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column()
  declare drugId?: number

  @column()
  declare recordId: number

  @belongsTo(() => Drug)
  declare drug: BelongsTo<typeof Drug>

  @belongsTo(() => Record)
  declare record: BelongsTo<typeof Record>
}
