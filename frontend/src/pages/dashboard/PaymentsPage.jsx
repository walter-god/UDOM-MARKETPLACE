import { useEffect, useState } from 'react';
import { getTransactions, getInvoices } from '../../api/payments';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FileText } from 'lucide-react';

const statusBadge = { completed: 'badge-green', pending: 'badge-yellow', failed: 'badge-red', refunded: 'badge-gray' };

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions().then(r => setTransactions(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1>
      <div className="card">
        {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Reference</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Method</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{t.reference_number}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">TZS {parseFloat(t.amount).toLocaleString()}</td>
                    <td className="py-3 px-3 capitalize text-gray-500">{t.payment_method?.replace('_', ' ')}</td>
                    <td className="py-3 px-3"><span className={`badge ${statusBadge[t.status] || 'badge-gray'}`}>{t.status}</span></td>
                    <td className="py-3 px-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
