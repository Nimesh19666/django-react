from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'items', views.InventoryItemViewSet)
router.register(r'transactions', views.InventoryTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
