import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  metadata: Record<string, any>;
  prices: Array<{
    id: string;
    unit_amount: number;
    currency: string;
    recurring: { interval: string } | null;
    active: boolean;
  }>;
}

interface SubscriptionData {
  subscription: any;
  status: string | null;
}

export function useProducts() {
  return useQuery<{ data: Product[] }>({
    queryKey: ["/api/stripe/products"],
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubscription() {
  return useQuery<SubscriptionData>({
    queryKey: ["/api/stripe/subscription"],
    staleTime: 1000 * 30,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}
