"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockOSPTransactions } from "@/lib/mock-data/osp-transactions";
import { OSPStatus } from "@/types/osp-tracking";
import { format, differenceInDays } from "date-fns";

export default function OSPTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTransactions = mockOSPTransactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      transaction.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.childPartName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeTransactions = mockOSPTransactions.filter(
    (t) => t.status !== OSPStatus.RECEIVED
  );
  const overdueTransactions = mockOSPTransactions.filter(
    (t) => t.delayDays !== null && t.delayDays > 0
  );

  const getStatusBadge = (status: OSPStatus) => {
    switch (status) {
      case OSPStatus.SENT:
        return <Badge className="bg-blue-100 text-blue-800">📤 Sent to Vendor</Badge>;
      case OSPStatus.IN_PROCESS:
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ In Process</Badge>;
      case OSPStatus.READY:
        return <Badge className="bg-green-100 text-green-800">✅ Ready for Pickup</Badge>;
      case OSPStatus.RECEIVED:
        return <Badge className="bg-gray-100 text-gray-800">✓ Received</Badge>;
      case OSPStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDelayBadge = (delayDays: number | null, status: OSPStatus) => {
    if (status === OSPStatus.RECEIVED || delayDays === null || delayDays === 0) {
      return null;
    }

    return (
      <Badge className="bg-red-100 text-red-800">
        🔴 OVERDUE ({delayDays} day{delayDays > 1 ? "s" : ""})
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Outsource (OSP) Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Track parts sent to external vendors for specialized processes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="text-sm text-muted-foreground">Active Transactions</div>
          <div className="text-3xl font-bold text-blue-600">{activeTransactions.length}</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="text-3xl font-bold text-red-600">{overdueTransactions.length}</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="text-sm text-muted-foreground">Completed (This Month)</div>
          <div className="text-3xl font-bold text-green-600">
            {mockOSPTransactions.filter((t) => t.status === OSPStatus.RECEIVED).length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              placeholder="Order, part, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={OSPStatus.SENT}>Sent to Vendor</SelectItem>
                <SelectItem value={OSPStatus.IN_PROCESS}>In Process</SelectItem>
                <SelectItem value={OSPStatus.READY}>Ready for Pickup</SelectItem>
                <SelectItem value={OSPStatus.RECEIVED}>Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const isOverdue = transaction.delayDays !== null && transaction.delayDays > 0;
          const daysInProcess =
            transaction.status !== OSPStatus.RECEIVED
              ? differenceInDays(new Date(), new Date(transaction.sentDate))
              : differenceInDays(
                  new Date(transaction.actualReturnDate!),
                  new Date(transaction.sentDate)
                );

          return (
            <Card
              key={transaction.id}
              className={`p-6 border-l-4 ${
                isOverdue
                  ? "border-l-red-500"
                  : transaction.status === OSPStatus.READY
                  ? "border-l-green-500"
                  : transaction.status === OSPStatus.RECEIVED
                  ? "border-l-gray-400"
                  : "border-l-yellow-500"
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">
                        {transaction.id.toUpperCase()} | {transaction.ospProcessType}
                      </h3>
                      {getDelayBadge(transaction.delayDays, transaction.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order #{transaction.orderNo} - {transaction.childPartName}
                    </div>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Vendor</div>
                    <div className="font-semibold">{transaction.vendorName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Sent Date</div>
                    <div className="font-semibold">
                      {format(new Date(transaction.sentDate), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">({daysInProcess} days ago)</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Expected Return</div>
                    <div className="font-semibold">
                      {format(new Date(transaction.expectedReturnDate), "MMM dd, yyyy")}
                    </div>
                    {transaction.status !== OSPStatus.RECEIVED && (
                      <div className="text-xs text-muted-foreground">
                        (
                        {differenceInDays(new Date(transaction.expectedReturnDate), new Date()) > 0
                          ? `${differenceInDays(
                              new Date(transaction.expectedReturnDate),
                              new Date()
                            )} days left`
                          : "Past due"}
                        )
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Quantity</div>
                    <div className="font-semibold">
                      {transaction.quantitySent} pcs sent
                      {transaction.quantityReceived > 0 &&
                        ` • ${transaction.quantityReceived} received`}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <strong>Challan:</strong> {transaction.challanNumber}
                  </div>
                  {transaction.invoiceNumber && (
                    <div>
                      <strong>Invoice:</strong> {transaction.invoiceNumber}
                    </div>
                  )}
                  {transaction.invoiceAmount && (
                    <div>
                      <strong>Amount:</strong> ₹{transaction.invoiceAmount.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Issues */}
                {transaction.receivedWithIssues && transaction.issueDescription && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div className="text-sm">
                        <strong className="text-red-800">Quality Issue:</strong>
                        <div className="text-red-600 mt-1">{transaction.issueDescription}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {transaction.status === OSPStatus.READY && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Mark Received
                    </Button>
                  )}
                  {transaction.status === OSPStatus.IN_PROCESS && (
                    <Button size="sm" variant="outline">
                      📞 Call Vendor
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Challan
                  </Button>
                  {transaction.status !== OSPStatus.RECEIVED && (
                    <Button size="sm" variant="outline">
                      Report Issue
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {filteredTransactions.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No OSP transactions found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Action Footer */}
      <Card className="p-6 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">OSP Management</div>
          <div className="flex gap-2">
            <Button variant="outline">Create New OSP</Button>
            <Button variant="outline">Vendor Performance</Button>
            <Button>Reports</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
