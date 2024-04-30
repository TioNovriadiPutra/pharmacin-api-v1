import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'records'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nik', 20).notNullable()
      table.string('full_name', 50).notNullable()
      table.text('address').notNullable()
      table.string('record_number', 10).notNullable()
      table.enum('gender', ['male', 'female']).notNullable()
      table.string('pob', 45).notNullable()
      table.date('dob').notNullable()
      table.string('phone', 20).notNullable()
      table.string('occupation_name', 45).notNullable()
      table.string('allergy').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('nik')
      table.dropColumn('full_name')
      table.dropColumn('address')
      table.dropColumn('record_number')
      table.dropColumn('gender')
      table.dropColumn('pob')
      table.dropColumn('dob')
      table.dropColumn('phone')
      table.dropColumn('occupation_name')
      table.dropColumn('allergy')
    })
  }
}
