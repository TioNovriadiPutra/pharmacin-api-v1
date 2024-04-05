import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class PatientPolicy extends BasePolicy {
  handle(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMINISTRATOR']
  }

  view(user: User): AuthorizerResponse {
    return this.handle(user) || user.roleId === Role['ADMIN']
  }
}
