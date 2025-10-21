import { type ColumnDef } from "@tanstack/react-table";
import { type Transaction } from "@/models/transaction";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "transaction_id",
    header: "Transaction ID",
  },
  {
    accessorKey: "transaction_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("transaction_type");
      return (
        <div
          className={cn(
            "text-left font-medium",
            type === "BUY" ? "text-green-400" : "text-red-400"
          )}
        >
          {type === "BUY" ? "BUY" : "SELL"}
        </div>
      );
    },
  },
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "price_per_share",
    header: "Price",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price_per_share"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "transaction_date",
    header: "Timestamp",
    cell: ({ row }) => {
      const timestamp = row.getValue("transaction_date");
      const formatted = new Date(timestamp as string).toLocaleString();
      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
];
