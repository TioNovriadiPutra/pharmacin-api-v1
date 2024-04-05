import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'

export default class DoctorAssistantPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  handle(user: User, assistant: User): AuthorizerResponse {
    return this.view(user) && user.clinicId === assistant.clinicId
  }
}
