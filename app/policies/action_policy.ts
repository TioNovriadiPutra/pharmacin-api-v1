import User from '#models/user'
import Action from '#models/action'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class ActionPolicy extends BasePolicy {
  create(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  view(user: User): AuthorizerResponse {
    return (
      this.create(user) || user.roleId === Role['ADMINISTRATOR'] || user.roleId === Role['DOCTOR']
    )
  }

  handle(user: User, action: Action): AuthorizerResponse {
    return this.create(user) && action.clinicId === user.clinicId
  }
}
