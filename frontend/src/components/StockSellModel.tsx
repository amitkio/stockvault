"use client";

import * as React from "react";
import { z } from "zod";
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

// --- UPDATED SCHEMA ---
// This now matches the 'EnrichedHolding' type from your parent dashboard page.
export const holdingSchema = z.object({
  id: z.union([z.string(), z.number()]), // <-- FIX 1: Was z.number()
  symbol: z.string(),
  company_name: z.string(),
  quantity: z.number(),
  average_cost_per_share: z.number(),
  current_price: z.number(),
  open_price: z.number(), // <-- FIX 2: Added missing property
});

type EnrichedHolding = z.infer<typeof holdingSchema>;

interface StockSellModalProps {
  stock: EnrichedHolding;
  onSellSuccess?: () => void;
}

// Copied the currency formatter from your DataTable
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function StockSellModal({ stock, onSellSuccess }: StockSellModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState("1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const numericQuantity = Number(quantity) || 0;
  const maxQuantity = stock.quantity;

  // --- Calculations ---
  const totalSaleValue = numericQuantity * stock.current_price;
  const costBasis = numericQuantity * stock.average_cost_per_share;
  const profitOrLoss = totalSaleValue - costBasis;
  const unitProfitOrLoss = stock.current_price - stock.average_cost_per_share;

  // --- Validation ---
  const isValidQuantity =
    numericQuantity > 0 &&
    numericQuantity <= maxQuantity &&
    // Simple check for whole shares. Adjust if fractional shares are allowed.
    Number.isInteger(numericQuantity);

  React.useEffect(() => {
    if (numericQuantity <= 0 && quantity !== "") {
      setError("Quantity must be a positive number.");
    } else if (numericQuantity > maxQuantity) {
      setError(`You can only sell up to ${maxQuantity} shares.`);
    } else if (quantity !== "" && !Number.isInteger(numericQuantity)) {
      setError("Quantity must be a whole number.");
    } else {
      setError(null);
    }
  }, [quantity, numericQuantity, maxQuantity]);

  // --- Submit Handler ---
  const handleSellSubmit = async () => {
    if (!isValidQuantity) {
      setError("Please enter a valid quantity.");
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
            transaction_type: "SELL",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transaction failed");
      }

      // Success!
      console.log("Sale successful!");
      setIsOpen(false);
      setQuantity("1");
      onSellSuccess?.(); // Trigger parent refresh callback
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset quantity on open/close
  React.useEffect(() => {
    if (!isOpen) {
      setQuantity("1");
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Sell
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Sell {stock.company_name} ({stock.symbol})
          </DialogTitle>
          <DialogDescription>
            You currently own <strong>{stock.quantity}</strong> shares.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* --- Price Info --- */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Avg. Cost Price:</span>
            <span className="text-right font-medium">
              {formatCurrency(stock.average_cost_per_share)}
            </span>
            <span className="text-muted-foreground">Current Price:</span>
            <span className="text-right font-medium">
              {formatCurrency(stock.current_price)}
            </span>
            <span className="text-muted-foreground">P/L per Share:</span>
            <span
              className={`text-right font-medium ${
                unitProfitOrLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(unitProfitOrLoss)}
            </span>
          </div>

          {/* --- Quantity Input --- */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <div className="col-span-3 relative">
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="pr-16"
                min="1"
                step="1"
                max={maxQuantity}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                onClick={() => setQuantity(String(maxQuantity))}
              >
                Max
              </Button>
            </div>
          </div>

          {/* --- Transaction Summary --- */}
          <div className="mt-4 border-t pt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="text-lg font-medium">Total Sale Value:</span>
            <span className="text-lg font-medium text-right">
              {formatCurrency(totalSaleValue)}
            </span>
            <span className="text-muted-foreground">Est. Profit/Loss:</span>
            <span
              className={`text-right font-medium ${
                profitOrLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(profitOrLoss)}
            </span>
          </div>

          {/* --- Error Message --- */}
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSellSubmit}
            disabled={isLoading || !isValidQuantity || !!error}
          >
            {isLoading ? "Processing..." : "Confirm Sell"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
