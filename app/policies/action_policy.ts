import User from '#models/user'
import Action from '#models/action'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class ActionPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return (
      user.roleId === Role['ADMIN'] ||
      user.roleId === Role['ADMINISTRATOR'] ||
      user.roleId === Role['DOCTOR']
    )
  }

  create(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  handle(user: User, action: Action): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] && action.clinicId === user.clinicId
  }
}
