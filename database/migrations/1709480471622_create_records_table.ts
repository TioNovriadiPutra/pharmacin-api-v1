import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('weight').nullable()
      table.integer('height').nullable()
      table.integer('temperature').nullable()
      table.integer('blood_pressure').nullable()
      table.integer('pulse').nullable()
      table.text('subjective').nullable()
      table.text('assessment').nullable()
      table.text('objective').nullable()
      table.text('plan').nullable()
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
      table.string('doctor_name', 50).notNullable()
      table.string('clinic_name', 50).notNullable()
      table.string('clinic_phone', 20).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table
        .integer('patient_id')
        .unsigned()
        .references('id')
        .inTable('patients')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('doctor_id')
        .unsigned()
        .references('id')
        .inTable('doctors')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('clinic_id')
        .unsigned()
        .references('id')
        .inTable('clinics')
        .onDelete('SET NULL')
        .nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
