import { test } from '@japa/runner'

test.group('POST Auth registerAdmin', () => {
  test('return response status code 422 when got validation error', async ({ client }) => {
    const response = await client.post('/auth/register/admin')

    response.assertStatus(422)
  })
})
