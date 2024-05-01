import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'queues'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .enum('status', ['consult-wait', 'consulting', 'payment', 'drug-pick-up', 'done'])
        .defaultTo('consult-wait')
      table.string('registration_number', 20).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
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
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('doctor_id')
        .unsigned()
        .references('id')
        .inTable('doctors')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
