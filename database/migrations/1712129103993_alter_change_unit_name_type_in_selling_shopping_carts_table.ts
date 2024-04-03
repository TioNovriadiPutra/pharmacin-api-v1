import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_shopping_carts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('unit_name', 30).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('unit_name', 30).notNullable().alter()
    })
  }
}
