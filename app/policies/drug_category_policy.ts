import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '../enums/role_enum.js'
import DrugCategory from '#models/drug_category'

export default class DrugCategoryPolicy extends BasePolicy {
  viewAndAdd(user: User): AuthorizerResponse {
    return user.roleId === Role['ADMIN'] || user.roleId === Role['ADMINISTRATOR']
  }

  update(user: User, drugCategory: DrugCategory): AuthorizerResponse {
    return this.viewAndAdd(user) && user.clinicId === drugCategory.clinicId
  }
}
