import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clinics'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('cashier_status', ['open', 'close']).notNullable().defaultTo('close')
      table.timestamp('open_cashier_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cashier_status')
      table.dropColumn('open_cashier_at')
    })
  }
}
