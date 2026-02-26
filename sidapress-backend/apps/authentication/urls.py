from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'roles', views.RolViewSet)
router.register(r'permisos', views.PermisoViewSet)

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('logout/', views.logout_view, name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('profile/', views.profile_view, name='auth-profile'),
    path('profile/update/', views.update_profile_view, name='auth-profile-update'),
    path('change-password/', views.change_password_view, name='auth-change-password'),
    path('', include(router.urls)),
]
