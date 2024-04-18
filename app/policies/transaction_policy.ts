import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import SellingTransaction from '#models/selling_transaction'

export default class TransactionPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] || user.roleId === Role['ADMINISTRATOR']
  }

  handleCart(user: User, transaction: SellingTransaction): AuthorizerResponse {
    return (
      user.roleId === Role['NURSE'] &&
      transaction.status === false &&
      user.clinicId === transaction.clinicId
    )
  }
}
