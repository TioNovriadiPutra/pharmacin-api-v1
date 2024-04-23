import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Patient from '#models/patient'

export default class PatientPolicy extends BasePolicy {
  handle(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMINISTRATOR']
  }

  addQueue(user: User, patient: Patient): AuthorizerResponse {
    return this.handle(user) && user.clinicId === patient.clinicId
  }

  view(user: User): AuthorizerResponse {
    return this.handle(user) || user.roleId === Role['ADMIN']
  }
}
