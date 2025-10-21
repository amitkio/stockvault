import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// Import the modal component
import { StockBuyModal } from "@/components/StockBuyModel"; // Assuming file is at components/StockBuyModel.tsx

// 1. Changed 'id' to 'stock_id' to match your API
interface Stock {
  stock_id: number;
  company_name: string;
  latest_ohlc: {
    close: number;
    date: string;
    high: number;
    low: number;
    open: number;
    volume: number;
  };
  sector: string;
  symbol: string;
}

export const columns: ColumnDef<Stock>[] = [
  {
    accessorKey: "company_name",
    header: "Company Name",
  },
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "sector",
    header: "Sector",
  },
  {
    accessorKey: "latest_ohlc.close",
    header: "Price",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("latest_ohlc_close"));
      const { latest_ohlc } = row.original;

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(amount);

      return (
        <div
          className={cn(
            "text-left font-medium",
            latest_ohlc.close > latest_ohlc.open
              ? "text-green-400"
              : "text-red-400"
          )}
        >
          {formatted}
        </div>
      );
    },
  },
  {
    id: "change_percent",
    header: "Change %",
    cell: ({ row }) => {
      const { latest_ohlc } = row.original;
      const { open, close } = latest_ohlc;

      if (open === 0) {
        return <div className="text-left font-medium">0.00%</div>;
      }

      const change = (close - open) / open;

      const formatted = new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "always",
      }).format(change);

      return (
        <div
          className={cn(
            "text-left font-medium",
            close > open ? "text-green-400" : "text-red-400"
          )}
        >
          {formatted}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const stock = row.original;

      // 2. Map the table's 'stock' object to what the modal expects
      const modalStockProps = {
        id: stock.stock_id, // <--- Use stock_id here
        symbol: stock.symbol,
        name: stock.company_name,
        current_price: stock.latest_ohlc.close,
      };

      return (
        <StockBuyModal
          stock={modalStockProps}
          // Optional: You can pass the 'onBuySuccess' prop
          // to trigger a refetch of your table data
          // onBuySuccess={() => console.log("Refetch table data!")}
        />
      );
    },
  },
];
