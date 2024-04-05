import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'action_carts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('action_name', 50).notNullable()
      table.integer('action_price').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table
        .integer('action_id')
        .unsigned()
        .references('id')
        .inTable('actions')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('selling_transaction_id')
        .unsigned()
        .references('id')
        .inTable('selling_transactions')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
