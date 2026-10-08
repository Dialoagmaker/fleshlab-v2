import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  DollarSign,
  Video,
  Users,
  AlertTriangle
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function AdminPayments() {
  const [filters, setFilters] = useState({
    payment_type: 'all',
    status: 'all',
    search: '',
  });
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['adminPayments', filters],
    queryFn: () => base44.functions.invoke('adminPaymentsList', {
      limit: 50,
      skip: 0,
      ...filters,
    }),
  });

  const payments = paymentsData?.data?.payments || [];
  const summary = paymentsData?.data?.summary || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getEntitlementStatusIcon = (status) => {
    if (status === 'granted') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'not_granted') return <XCircle className="w-4 h-4 text-red-600" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const getAttributionStatusBadge = (status) => {
    const variants = {
      attributed: 'default',
      not_attributable: 'secondary',
      global_fanclub_unattributed: 'secondary',
      missing: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const diagnosticFlags = (payment) => {
    if (!payment.diagnostic_flags || payment.diagnostic_flags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {payment.diagnostic_flags.map((flag, idx) => (
          <Badge 
            key={idx} 
            variant={flag.severity === 'error' ? 'destructive' : flag.severity === 'warning' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {flag.severity === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {flag.message}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <>
      <SEOMeta
        title="Admin - Payment Management"
        description="View and manage all payments"
        canonical="/admin/payments"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
            <p className="text-muted-foreground mt-1">View payments, entitlements, and revenue attribution</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_payments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PPV Payments</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.by_type?.ppv || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.by_type?.fanclub || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entitlement Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.entitlement_issues || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attribution Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.attribution_issues || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <select
                    value={filters.payment_type}
                    onChange={(e) => handleFilterChange('payment_type', e.target.value)}
                    className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="ppv">PPV</option>
                    <option value="fanclub">Fanclub</option>
                    <option value="guest_production_deposit">Deposit</option>
                  </select>
                </div>
                <div className="w-[150px]">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-5 h-5" />
                  <p>Failed to load payments</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">User</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Related Entity</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Entitlement</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Attribution</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Test</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr 
                          key={payment.id} 
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => setSelectedPayment(selectedPayment?.id === payment.id ? null : payment)}
                        >
                          <td className="p-3 text-xs">
                            {new Date(payment.created_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-xs">
                            <div>{payment.user_email}</div>
                            <div className="text-muted-foreground text-[10px]">{payment.user_id.slice(0, 8)}</div>
                          </td>
                          <td className="p-3 text-xs capitalize">
                            {payment.payment_type.replace('_', ' ')}
                          </td>
                          <td className="p-3 text-xs font-medium">
                            ${payment.amount_usd} {payment.currency}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="p-3 text-xs max-w-[200px]">
                            <div className="truncate">{payment.related_entity_title || 'N/A'}</div>
                            <div className="text-muted-foreground text-[10px]">
                              {payment.related_entity_type}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {getEntitlementStatusIcon(payment.entitlement?.status)}
                              <span className="text-xs">{payment.entitlement?.status || 'unknown'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {getAttributionStatusBadge(payment.revenue_attribution?.status)}
                          </td>
                          <td className="p-3">
                            {payment.is_test_mode ? (
                              <Badge variant="outline" className="text-xs">TEST</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Detail Dialog */}
          {selectedPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Payment Details</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}>
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment ID</p>
                      <p className="text-sm font-mono">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">{new Date(selectedPayment.created_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="text-sm">{selectedPayment.user_email}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedPayment.user_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="text-sm">{selectedPayment.provider}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedPayment.provider_session_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Type</p>
                      <p className="text-sm capitalize">{selectedPayment.payment_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-medium">${selectedPayment.amount_usd} {selectedPayment.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Test Mode</p>
                      <Badge variant={selectedPayment.is_test_mode ? 'destructive' : 'secondary'}>
                        {selectedPayment.is_test_mode ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2">Related Entity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm">{selectedPayment.related_entity_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ID</p>
                        <p className="text-sm font-mono">{selectedPayment.related_entity_id}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Title</p>
                        <p className="text-sm">{selectedPayment.related_entity_title || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2">Entitlement</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getEntitlementStatusIcon(selectedPayment.entitlement?.status)}
                      <span className="text-sm font-medium">{selectedPayment.entitlement?.status}</span>
                    </div>
                    {selectedPayment.entitlement?.details && (
                      <p className="text-xs text-muted-foreground">{selectedPayment.entitlement.details}</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2">Revenue Attribution</h3>
                    <div className="mb-2">{getAttributionStatusBadge(selectedPayment.revenue_attribution?.status)}</div>
                    {selectedPayment.revenue_attribution?.details && (
                      <p className="text-xs text-muted-foreground mb-2">{selectedPayment.revenue_attribution.details}</p>
                    )}
                    {selectedPayment.revenue_attribution?.performer_line_items && 
                     selectedPayment.revenue_attribution.performer_line_items.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Performer Line Items:</p>
                        {selectedPayment.revenue_attribution.performer_line_items.map((item, idx) => (
                          <div key={idx} className="text-xs p-2 border rounded bg-muted/30">
                            <div className="flex justify-between">
                              <span>{item.performer_name}</span>
                              <span className="font-medium">${item.performer_amount}</span>
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                              Gross: ${item.gross} | Share: {item.performer_share_percent}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedPayment.diagnostic_flags && selectedPayment.diagnostic_flags.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold mb-2">Diagnostic Flags</h3>
                      <div className="space-y-2">
                        {selectedPayment.diagnostic_flags.map((flag, idx) => (
                          <div 
                            key={idx} 
                            className={`text-xs p-2 rounded flex items-start gap-2 ${
                              flag.severity === 'error' ? 'bg-red-100 text-red-800' :
                              flag.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{flag.code}</p>
                              <p>{flag.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}