"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TransactionsDataTable } from "@/components/TransactionsDataTable";
import { columns } from "@/components/transactions-table-columns";
import { type Transaction } from "@/models/transaction";

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/portfolio/transactions", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data: Transaction[] = await res.json();
      console.log(data);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <p>Loading Transactions...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <h1 className="px-4 text-2xl font-semibold tracking-tight lg:px-6">
                  Transactions
                </h1>
                <div className="px-4 lg:px-6">
                  <TransactionsDataTable
                    columns={columns}
                    data={transactions}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
