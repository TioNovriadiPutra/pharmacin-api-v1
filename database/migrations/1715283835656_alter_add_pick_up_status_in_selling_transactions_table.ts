import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('pick_up_status').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('pick_up_status')
    })
  }
}
