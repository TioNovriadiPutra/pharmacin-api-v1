import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'drug_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('category_number', 50).nullable().unique()
      table.string('category_name', 100).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table
        .integer('clinic_id')
        .unsigned()
        .references('id')
        .inTable('clinics')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
