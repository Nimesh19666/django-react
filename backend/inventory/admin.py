from django.contrib import admin
from .models import Supplier, InventoryItem, InventoryTransaction

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone')
    search_fields = ('name', 'contact_person', 'email')
    list_filter = ('created_at',)

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'quantity', 'price', 'supplier', 'is_low_stock')
    search_fields = ('name', 'sku', 'description')
    list_filter = ('supplier', 'created_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('item', 'transaction_type', 'quantity', 'user', 'transaction_date')
    search_fields = ('item__name', 'notes')
    list_filter = ('transaction_type', 'transaction_date', 'user')
    readonly_fields = ('transaction_date',)
