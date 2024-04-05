import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('queue_id')
        .unsigned()
        .references('id')
        .inTable('queues')
        .onDelete('SET NULL')
        .nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('queue_id')
      table.dropColumn('queue_id')
    })
  }
}
