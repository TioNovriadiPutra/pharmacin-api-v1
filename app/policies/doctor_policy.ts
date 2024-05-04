import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Queue from '#models/queue'
import { QueueStatus } from '../enums/queue_enum.js'

export default class DoctorPolicy extends BasePolicy {
  admin(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN']
  }

  view(user: User): AuthorizerResponse {
    return this.admin(user) || user.roleId === Role['ADMINISTRATOR']
  }

  viewDetail(user: User, doctor: User): AuthorizerResponse {
    return this.admin(user) && user.clinicId === doctor.clinicId && doctor.roleId === Role['DOCTOR']
  }

  create(user: User, doctor: User): AuthorizerResponse {
    return this.admin(user) && user.clinicId === doctor.clinicId && doctor.roleId === Role['DOCTOR']
  }

  assessment(user: User, queue: Queue): AuthorizerResponse {
    return (
      user.roleId === Role['DOCTOR'] &&
      user.clinicId === queue.clinicId &&
      queue.status === QueueStatus['CONSULTING']
    )
  }
}
