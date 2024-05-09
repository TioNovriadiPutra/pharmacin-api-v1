import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import DrugFactory from './drug_factory.js'
import DrugCategory from './drug_category.js'
import Drug from './drug.js'
import PurchaseTransaction from './purchase_transaction.js'
import Patient from './patient.js'
import Doctor from './doctor.js'
import Record from './record.js'
import SellingTransaction from './selling_transaction.js'
import Action from './action.js'
import { Cashier } from '../enums/cashier_enum.js'
import CashierHistory from './cashier_history.js'

export default class Clinic extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clinicName: string

  @column()
  declare clinicPhone: string

  @column()
  declare address?: string

  @column()
  declare paymentStatus: boolean

  @column()
  declare outpatientFee: number

  @column()
  declare sellingFee: number

  @column()
  declare cashierStatus: Cashier

  @column.dateTime()
  declare openCashierAt?: DateTime

  @column()
  declare openBy?: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @manyToMany(() => DrugFactory, {
    pivotTable: 'factory_partnerships',
  })
  declare partnerships: ManyToMany<typeof DrugFactory>

  @hasMany(() => DrugCategory)
  declare drugCategories: HasMany<typeof DrugCategory>

  @hasMany(() => Drug)
  declare drugs: HasMany<typeof Drug>

  @hasMany(() => PurchaseTransaction)
  declare purchaseTransactions: HasMany<typeof PurchaseTransaction>

  @hasMany(() => Patient)
  declare patients: HasMany<typeof Patient>

  @hasMany(() => Doctor)
  declare doctor: HasMany<typeof Doctor>

  @hasMany(() => Record)
  declare records: HasMany<typeof Record>

  @hasMany(() => SellingTransaction)
  declare sellingTransactions: HasMany<typeof SellingTransaction>

  @hasMany(() => Action)
  declare actions: HasMany<typeof Action>

  @hasMany(() => CashierHistory)
  declare cashierHistories: HasMany<typeof CashierHistory>
}
