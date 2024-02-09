import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import DrugFactory from './drug_factory.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import DrugCategory from './drug_category.js'
import Clinic from './clinic.js'
import DrugStock from './drug_stock.js'
import PurchaseShoppingCart from './purchase_shopping_cart.js'

export default class Drug extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare drugNumber: string

  @column()
  declare drug: string

  @column()
  declare drugGenericName?: string

  @column()
  declare dose: string

  @column()
  declare shelve?: number

  @column()
  declare purchasePrice: number

  @column()
  declare sellingPrice: number

  @column()
  declare totalStock: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare drugFactoryId: number

  @column()
  declare drugCategoryId: number

  @column()
  declare clinicId: number

  @belongsTo(() => DrugFactory)
  declare drugFactory: BelongsTo<typeof DrugFactory>

  @belongsTo(() => DrugCategory)
  declare drugCategory: BelongsTo<typeof DrugCategory>

  @belongsTo(() => Clinic)
  declare clinic: BelongsTo<typeof Clinic>

  @hasMany(() => DrugStock)
  declare drugStocks: HasMany<typeof DrugStock>

  @hasMany(() => PurchaseShoppingCart)
  declare purchaseShoppingCarts: HasMany<typeof PurchaseShoppingCart>
}
