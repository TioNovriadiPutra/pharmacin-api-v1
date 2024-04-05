import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Profile from './profile.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import DoctorSpecialist from './doctor_specialist.js'
import DoctorAssistant from './doctor_assistant.js'
import Queue from './queue.js'
import Clinic from './clinic.js'
import Record from './record.js'

export default class Doctor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare profileId: number

  @column()
  declare specialityId?: number

  @column()
  declare clinicId: number

  @belongsTo(() => Profile)
  declare profile: BelongsTo<typeof Profile>

  @belongsTo(() => DoctorSpecialist, {
    foreignKey: 'specialityId',
  })
  declare doctorSpeciality: BelongsTo<typeof DoctorSpecialist>

  @hasMany(() => DoctorAssistant)
  declare assistants: HasMany<typeof DoctorAssistant>

  @hasMany(() => Queue)
  declare queues: HasMany<typeof Queue>

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>

  @hasMany(() => Record)
  declare records: HasMany<typeof Record>
}
