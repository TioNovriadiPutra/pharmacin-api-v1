import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clinics'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('outpatient_fee').notNullable().defaultTo(0)
      table.integer('selling_fee').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('outpatient_fee')
      table.dropColumn('selling_fee')
    })
  }
}
