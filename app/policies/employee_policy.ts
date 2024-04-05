import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class EmployeePolicy extends BasePolicy {
  detail(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  view(user: User): AuthorizerResponse {
    return this.detail(user) || user.roleId === Role['ADMINISTRATOR']
  }

  handle(user: User, employee: User): AuthorizerResponse {
    return this.detail(user) && user.clinicId === employee.clinicId
  }
}
