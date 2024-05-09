import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Clinic from '#models/clinic'

export default class ClinicPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  handleCashier(user: User, clinic: Clinic): AuthorizerResponse {
    return user.roleId === Role['NURSE'] && user.clinicId === clinic.id
  }
}
