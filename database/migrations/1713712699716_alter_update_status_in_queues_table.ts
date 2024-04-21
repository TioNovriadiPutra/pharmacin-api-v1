import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'queues'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['consult-wait', 'consulting', 'payment', 'drug-pick-up', 'done'])
        .defaultTo('consult-wait')
        .alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['consult-wait', 'consulting', 'drug-wait', 'drug-pick-up', 'done'])
        .defaultTo('consult-wait')
    })
  }
}
