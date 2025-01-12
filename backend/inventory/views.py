from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F, DecimalField
from django.utils import timezone
import csv
from django.http import HttpResponse
from .models import Supplier, InventoryItem, InventoryTransaction
from .serializers import (
    SupplierSerializer, InventoryItemSerializer,
    InventoryTransactionSerializer, UserSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email']
    ordering_fields = ['name', 'created_at']

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'is_low_stock']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'quantity', 'price', 'created_at']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        total_items = self.get_queryset().count()
        low_stock_items = self.get_queryset().filter(quantity__lte=F('threshold')).count()
        total_value = self.get_queryset().aggregate(
            total=Sum(F('quantity') * F('price'), output_field=DecimalField())
        )['total'] or 0

        # Get recent transactions
        recent_transactions = InventoryTransaction.objects.select_related('item').order_by('-created_at')[:5]
        
        return Response({
            'total_items': total_items,
            'low_stock_items': low_stock_items,
            'total_stock_value': total_value,
            'recent_transactions': InventoryTransactionSerializer(recent_transactions, many=True).data
        })

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="inventory_report_{timezone.now().date()}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'SKU', 'Quantity', 'Price', 'Supplier', 'Threshold', 'Is Low Stock'])
        
        for item in self.get_queryset():
            writer.writerow([
                item.name,
                item.sku,
                item.quantity,
                item.price,
                item.supplier.name if item.supplier else '',
                item.threshold,
                'Yes' if item.is_low_stock else 'No'
            ])
        
        return response

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['item', 'transaction_type', 'user']
    ordering_fields = ['transaction_date']

    def get_queryset(self):
        if not self.request.user.is_staff:
            return self.queryset.filter(user=self.request.user)
        return self.queryset
