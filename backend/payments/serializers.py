from rest_framework import serializers
from .models import Transaction, Invoice, Refund


class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Transaction
        fields = [
            'id', 'user_email', 'amount', 'currency', 'status', 'payment_method',
            'reference_number', 'description', 'created_at', 'completed_at',
        ]
        read_only_fields = ['id', 'user_email', 'reference_number', 'status', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'transaction', 'invoice_number', 'issued_date', 'due_date', 'pdf_file', 'notes']
        read_only_fields = ['id', 'invoice_number', 'issued_date']


class RefundSerializer(serializers.ModelSerializer):
    transaction_reference = serializers.ReadOnlyField(source='transaction.reference_number')
    requested_by_email = serializers.ReadOnlyField(source='requested_by.email')

    class Meta:
        model = Refund
        fields = [
            'id', 'transaction_reference', 'requested_by_email', 'amount',
            'reason', 'status', 'processed_at', 'created_at',
        ]
        read_only_fields = ['id', 'requested_by_email', 'status', 'processed_at', 'created_at']


class CreatePaymentIntentSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    payment_method = serializers.CharField()
