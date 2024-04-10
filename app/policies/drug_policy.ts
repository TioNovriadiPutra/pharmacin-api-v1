import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Drug from '#models/drug'

export default class DrugPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return (
      user.roleId === Role['ADMIN'] ||
      user.roleId === Role['ADMINISTRATOR'] ||
      user.roleId === Role['DOCTOR']
    )
  }

  update(user: User, drug: Drug): AuthorizerResponse {
    return this.view(user) && user.clinicId === drug.clinicId
  }
}
