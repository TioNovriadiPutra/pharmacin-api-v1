import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'units'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('unit_name', 30).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })

    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        {
          unit_name: 'Tabler',
        },
        {
          unit_name: 'Kapsul',
        },
        {
          unit_name: 'Sirup',
        },
        {
          unit_name: 'Kaplet',
        },
        {
          unit_name: 'Puyer',
        },
        {
          unit_name: 'Pil',
        },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
