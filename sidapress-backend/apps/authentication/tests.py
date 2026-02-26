from django.test import TestCase
from rest_framework.test import APIClient
from .models import Usuario


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            username='testuser', password='testpass123',
            email='test@test.com', dni='12345678',
        )

    def test_login_exitoso(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser', 'password': 'testpass123',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_fallido(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser', 'password': 'wrongpass',
        })
        self.assertEqual(response.status_code, 400)

    def test_profile_sin_auth(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, 401)

    def test_profile_con_auth(self):
        login = self.client.post('/api/auth/login/', {
            'username': 'testuser', 'password': 'testpass123',
        })
        token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'testuser')
