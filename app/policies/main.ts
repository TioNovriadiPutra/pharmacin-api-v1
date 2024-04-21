/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

export const policies = {
  StockPolicy: () => import('#policies/stock_policy'),
  DrugPolicy: () => import('#policies/drug_policy'),
  DrugCategoryPolicy: () => import('#policies/drug_category_policy'),
  DrugFactoryPolicy: () => import('#policies/drug_factory_policy'),
  ActionPolicy: () => import('#policies/action_policy'),
  TransactionPolicy: () => import('#policies/transaction_policy'),
  DoctorAssistantPolicy: () => import('#policies/doctor_assistant_policy'),
  EmployeePolicy: () => import('#policies/employee_policy'),
  DoctorSpecialistPolicy: () => import('#policies/doctor_specialist_policy'),
  UserPolicy: () => import('#policies/user_policy'),
  ClinicPolicy: () => import('#policies/clinic_policy'),
  DoctorPolicy: () => import('#policies/doctor_policy'),
  UnitPolicy: () => import('#policies/unit_policy'),
  PatientPolicy: () => import('#policies/patient_policy'),
  QueuePolicy: () => import('#policies/queue_policy'),
  AuthPolicy: () => import('#policies/auth_policy'),
}
