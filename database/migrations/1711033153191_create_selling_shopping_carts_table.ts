import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_shopping_carts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('drug_name', 50).notNullable()
      table.integer('selling_price').notNullable()
      table.string('instruction', 50).notNullable()
      table.integer('unit_name', 30).notNullable()
      table.integer('total_price').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table
        .integer('selling_transaction_id')
        .unsigned()
        .references('id')
        .inTable('selling_transactions')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('drug_id')
        .unsigned()
        .references('id')
        .inTable('drugs')
        .onDelete('SET NULL')
        .nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
