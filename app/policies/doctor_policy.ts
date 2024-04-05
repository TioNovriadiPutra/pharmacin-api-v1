import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Queue from '#models/queue'
import { QueueStatus } from '../enums/queue_enum.js'

export default class DoctorPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] || user.roleId === Role['ADMINISTRATOR']
  }

  create(user: User, doctor: User): AuthorizerResponse {
    return this.view(user) && user.clinicId === doctor.clinicId
  }

  assessment(user: User, queue: Queue): AuthorizerResponse {
    return (
      user.roleId === Role['DOCTOR'] &&
      user.clinicId === queue.clinicId &&
      queue.status === QueueStatus['CONSULTING']
    )
  }
}
