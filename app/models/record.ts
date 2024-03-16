import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Patient from './patient.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Doctor from './doctor.js'
import Clinic from './clinic.js'

export default class Record extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare weight?: number

  @column()
  declare height?: number

  @column()
  declare temperature?: number

  @column()
  declare bloodPressure?: number

  @column()
  declare pulse?: number

  @column()
  declare subjective?: string

  @column()
  declare objective?: string

  @column()
  declare plan?: string

  @column()
  declare assessment?: string

  @column()
  declare doctorName: string

  @column()
  declare clinicName: string

  @column()
  declare clinicPhone: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column()
  declare patientId: number

  @column()
  declare doctorId?: number

  @column()
  declare clinicId?: number

  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @belongsTo(() => Doctor)
  declare doctor: BelongsTo<typeof Doctor>

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>
}
