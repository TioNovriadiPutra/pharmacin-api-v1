import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'record_drug_assessments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('drug_name', 50).notNullable()
      table.string('unit_name', 30).notNullable()
      table.string('instruction', 50).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table
        .integer('drug_id')
        .unsigned()
        .references('id')
        .inTable('drugs')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('record_id')
        .unsigned()
        .references('id')
        .inTable('records')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
