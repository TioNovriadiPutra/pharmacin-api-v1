import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'drugs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('dose')
      table.integer('composition').notNullable()
      table.string('unit_name', 30).notNullable()
      table
        .integer('unit_id')
        .unsigned()
        .references('id')
        .inTable('units')
        .onDelete('SET NULL')
        .nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('dose', 20).notNullable()
      table.dropColumn('composition')
      table.dropForeign('unit_id')
      table.dropColumn('unit_id')
      table.dropColumn('unit_name')
    })
  }
}
