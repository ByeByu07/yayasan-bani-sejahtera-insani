import { useState } from "react";
import { toast } from "sonner";

interface Transaction {
    token: string;
    redirect_url: string;
}

export function useMidtrans() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [transaction, setTransaction] = useState<Transaction | null>(null);

    const createTransaction = async (id: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/midtrans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                }),
            });
            const data = await response.json();
            toast.success("Transaction created successfully");
            setTransaction(data as Transaction);
        } catch (error) {
            toast.error("Failed to create transaction");
        } finally {
            setIsProcessing(false);
        }
    };


    return {
        isProcessing,
        createTransaction,
        transaction,
    }
}
