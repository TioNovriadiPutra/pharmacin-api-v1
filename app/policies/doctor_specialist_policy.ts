import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class DoctorSpecialistPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] || user.roleId === Role['ADMINISTRATOR']
  }
}
