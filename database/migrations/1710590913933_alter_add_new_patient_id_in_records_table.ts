import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'records'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('patient_id')
        .unsigned()
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('patient_id')
      table.dropColumn('patient_id')
    })
  }
}
