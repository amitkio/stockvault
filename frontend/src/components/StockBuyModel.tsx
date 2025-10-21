import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockHistoryData {
  date: string;
  close: number;
}

interface StockHistoryChartProps {
  data: StockHistoryData[];
}

const chartConfig = {
  close: {
    label: "Close",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function StockHistoryChart({ data }: StockHistoryChartProps) {
  const domain = React.useMemo(() => {
    if (!data || data.length === 0) return [0, 100]; // Default domain
    const closePrices = data.map((item) => item.close);
    const min = Math.min(...closePrices);
    const max = Math.max(...closePrices);
    const padding = (max - min) * 0.1; // 10% padding
    return [Math.max(0, min - padding), max + padding];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Price History</CardTitle>
        <CardDescription>Closing price over the recent period.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 0,
              right: 12,
              top: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                // Assuming date is "YYYY-MM-DD", show "MM-DD"
                const parts = value.split("-");
                return parts.length === 3 ? `${parts[1]}-${parts[2]}` : value;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={domain}
              tickFormatter={(value) => `₹${value.toFixed(0)}`} // <--- Changed to ₹
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey="close"
              type="linear"
              fill="var(--color-primary-muted)"
              fillOpacity={0.4}
              stroke="var(--color-primary)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface Stock {
  id: number | string;
  symbol: string;
  name: string;
  current_price: number;
}

interface StockBuyModalProps {
  stock: Stock;
  onBuySuccess?: () => void;
}

export function StockBuyModal({ stock, onBuySuccess }: StockBuyModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState("1");
  const [cashBalance, setCashBalance] = React.useState(0);
  const [historyData, setHistoryData] = React.useState<StockHistoryData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch portfolio and history data when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem("token");
          // Fetch Cash Balance
          const portfolioRes = await fetch("http://127.0.0.1:5000/portfolio/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!portfolioRes.ok) throw new Error("Failed to fetch portfolio");
          const portfolioData = await portfolioRes.json();
          setCashBalance(portfolioData.cash_balance);

          // Fetch Stock History
          const historyRes = await fetch(
            `http://127.0.0.1:5000/stocks/${stock.id}/history`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!historyRes.ok) throw new Error("Failed to fetch stock history");
          const historyData = await historyRes.json();

          // Format data for the chart (ensure 'close' is a number)
          const formattedData = historyData.map((item: any) => ({
            date: item.date,
            close: Number(item.close),
          }));
          setHistoryData(formattedData);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, stock.id]); // Re-run if the modal opens or the stock ID changes

  // --- Form Calculations & Validation ---
  const numericQuantity = Number(quantity) || 0;
  const totalCost = numericQuantity * stock.current_price;
  const hasSufficientFunds = totalCost <= cashBalance;
  const isValidQuantity =
    numericQuantity > 0 && Number.isInteger(numericQuantity);

  // Real-time error for quantity input
  React.useEffect(() => {
    // Reset error if quantity is valid so far
    setError(null);

    if (numericQuantity <= 0 && quantity !== "") {
      setError("Quantity must be a positive number.");
    } else if (!hasSufficientFunds) {
      setError("Insufficient funds.");
    }
  }, [quantity, numericQuantity, hasSufficientFunds, cashBalance]);

  // --- Submit Handler ---
  const handleBuySubmit = async () => {
    // Final validation check
    if (!isValidQuantity || !hasSufficientFunds) {
      setError("Please fix the errors before submitting.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://127.0.0.1:5000/portfolio/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            symbol: stock.symbol,
            quantity: numericQuantity,
            transaction_type: "BUY",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transaction failed");
      }

      // Success!
      console.log("Purchase successful!");
      setIsOpen(false); // Close the modal
      setQuantity("1"); // Reset quantity
      onBuySuccess?.(); // Trigger parent refresh callback
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Buy</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Buy {stock.name} ({stock.symbol})
          </DialogTitle>
          <DialogDescription>
            Current Price: <strong>₹{stock.current_price.toFixed(2)}</strong>{" "}
            {/* <--- Changed to ₹ */}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* --- Stock Chart --- */}
          {isLoading && !historyData.length && <p>Loading chart...</p>}
          {!isLoading && historyData.length > 0 && (
            <StockHistoryChart data={historyData} />
          )}

          {/* --- Balance Info --- */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Your Cash Balance:</span>
            <span>{isLoading ? "..." : `₹${cashBalance.toFixed(2)}`}</span>{" "}
            {/* <--- Changed to ₹ */}
          </div>

          {/* --- Quantity Input --- */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              min="1"
              step="1"
            />
          </div>

          {/* --- Total Cost --- */}
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Total Cost:</span>
            <span className={!hasSufficientFunds ? "text-red-400" : ""}>
              ₹{totalCost.toFixed(2)} {/* <--- Changed to ₹ */}
            </span>
          </div>

          {/* --- Error Message --- */}
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleBuySubmit}
            disabled={isLoading || !isValidQuantity || !hasSufficientFunds}
          >
            {isLoading ? "Processing..." : "Confirm Buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
