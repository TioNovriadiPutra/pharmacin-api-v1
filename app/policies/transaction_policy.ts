import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import SellingTransaction from '#models/selling_transaction'
import PurchaseTransaction from '#models/purchase_transaction'

export default class TransactionPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] || user.roleId === Role['ADMINISTRATOR']
  }

  viewDetailPurchase(user: User, transaction: PurchaseTransaction): AuthorizerResponse {
    return this.view(user) && transaction.clinicId === user.clinicId
  }

  handleCart(user: User, transaction: SellingTransaction): AuthorizerResponse {
    return (
      user.roleId === Role['NURSE'] &&
      Boolean(transaction.status) === false &&
      user.clinicId === transaction.clinicId
    )
  }
}
