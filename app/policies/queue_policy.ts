import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import Queue from '#models/queue'
import { QueueStatus } from '../enums/queue_enum.js'

export default class QueuePolicy extends BasePolicy {
  addPatientQueue(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMINISTRATOR']
  }

  view(user: User) {
    return user.roleId === Role['ADMIN'] || this.addPatientQueue(user)
  }

  viewDoctor(user: User) {
    return user.roleId === Role['DOCTOR']
  }

  changeStatusToConsultingQueue(user: User, queue: Queue): AuthorizerResponse {
    return (
      user.roleId === Role['DOCTOR_ASSISTANT'] &&
      user.clinicId === queue.clinicId &&
      queue.status === QueueStatus['CONSULT_WAIT']
    )
  }

  cancelQueue(user: User, queue: Queue): AuthorizerResponse {
    return this.addPatientQueue(user) || this.changeStatusToConsultingQueue(user, queue)
  }

  viewPharmacyQueue(user: User) {
    return user.roleId === Role['NURSE']
  }
}
