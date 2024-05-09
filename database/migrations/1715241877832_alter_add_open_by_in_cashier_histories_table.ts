import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cashier_histories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('open_by', 50).notNullable()
      table.string('close_by', 50).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('open_by')
      table.dropColumn('close_by')
    })
  }
}
