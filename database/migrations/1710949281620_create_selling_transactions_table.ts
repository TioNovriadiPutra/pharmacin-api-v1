import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'selling_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('invoice_number', 100).notNullable()
      table.string('registration_number', 20).notNullable()
      table.integer('total_price').notNullable()
      table.boolean('status').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table
        .integer('record_id')
        .unsigned()
        .references('id')
        .inTable('records')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('clinic_id')
        .unsigned()
        .references('id')
        .inTable('clinics')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('patient_id')
        .unsigned()
        .references('id')
        .inTable('patients')
        .onDelete('SET NULL')
        .nullable()
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
    this.schema.dropTable(this.tableName)
  }
}
