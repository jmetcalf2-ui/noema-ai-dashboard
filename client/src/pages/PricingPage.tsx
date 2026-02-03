import { useState } from "react";
import { useProducts, useCheckout, useSubscription, isSubscriptionActive } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { user } = useAuth();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: subscriptionData } = useSubscription();
  const checkout = useCheckout();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const isSubscribed = isSubscriptionActive(subscriptionData?.status);
  const products = productsData?.data || [];

  const proProduct = products.find(p => p.name?.toLowerCase().includes('pro'));
  const monthlyPrice = proProduct?.prices?.find((p: any) => p.recurring?.interval === 'month');
  const yearlyPrice = proProduct?.prices?.find((p: any) => p.recurring?.interval === 'year');
  const currentPrice = billingInterval === 'month' ? monthlyPrice : yearlyPrice;

  const features = proProduct?.metadata?.features 
    ? JSON.parse(proProduct.metadata.features)
    : [
        'Unlimited file uploads',
        'Unlimited AI analyses',
        'Advanced visualizations',
        'Export to PDF & Excel',
        'Priority support',
        'Custom chart builder'
      ];

  const freeFeatures = [
    '3 file uploads',
    '5 AI analyses per month',
    'Basic visualizations',
    'Community support'
  ];

  const handleSubscribe = () => {
    if (!user) {
      window.location.href = '/api/login';
      return;
    }
    if (currentPrice?.id) {
      checkout.mutate(currentPrice.id);
    }
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-4">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with free and upgrade when you need more power. No credit card required.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
            <button
              onClick={() => setBillingInterval("month")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                billingInterval === "month" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-billing-monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                billingInterval === "year" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-billing-yearly"
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-600 font-medium">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-semibold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                disabled
                data-testid="button-free-plan"
              >
                {user ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="relative border-primary/50 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <CardDescription>For power users and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-semibold">
                  ${billingInterval === 'month' ? '29' : '290'}
                </span>
                <span className="text-muted-foreground">/{billingInterval}</span>
                {billingInterval === 'year' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    $24.17/month, billed annually
                  </p>
                )}
              </div>
              <ul className="space-y-3">
                {features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleSubscribe}
                disabled={checkout.isPending || isSubscribed}
                data-testid="button-pro-plan"
              >
                {checkout.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isSubscribed ? (
                  'Current Plan'
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Cancel anytime. No long-term contracts.
        </p>
      </div>
    </div>
  );
}
