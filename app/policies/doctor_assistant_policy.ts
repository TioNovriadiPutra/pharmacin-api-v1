import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class DoctorAssistantPolicy extends BasePolicy {
  admin(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  view(user: User): AuthorizerResponse {
    return this.admin(user) || user.roleId === Role['ADMINISTRATOR']
  }

  handle(user: User, assistant: User): AuthorizerResponse {
    return (
      this.admin(user) &&
      user.clinicId === assistant.clinicId &&
      assistant.roleId === Role['DOCTOR_ASSISTANT']
    )
  }
}
