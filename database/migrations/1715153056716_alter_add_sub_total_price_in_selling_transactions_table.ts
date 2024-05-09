import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('sub_total_price').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sub_total_price')
    })
  }
}
