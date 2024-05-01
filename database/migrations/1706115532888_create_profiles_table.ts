import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('full_name', 50).notNullable()
      table.enum('gender', ['male', 'female']).notNullable()
      table.string('phone', 20).notNullable()
      table.text('address').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
