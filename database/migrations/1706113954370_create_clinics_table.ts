import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clinics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('clinic_name', 50).notNullable()
      table.string('clinic_phone', 20).notNullable()
      table.boolean('payment_status').notNullable().defaultTo(false)
      table.text('address').nullable()
      table.integer('outpatient_fee').notNullable().defaultTo(0)
      table.integer('selling_fee').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
