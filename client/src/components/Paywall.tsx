import { useSubscription, isSubscriptionActive } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface PaywallProps {
  children: React.ReactNode;
  feature?: string;
}

export function Paywall({ children, feature = "this feature" }: PaywallProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: subscriptionData, isLoading: subLoading } = useSubscription();
  const [, setLocation] = useLocation();

  const isLoading = authLoading || subLoading;
  const hasAccess = isSubscriptionActive(subscriptionData?.status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto my-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Sign in Required</CardTitle>
          <CardDescription>
            Please sign in to access {feature}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-paywall-login"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="max-w-md mx-auto my-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Upgrade to Pro</CardTitle>
          <CardDescription>
            Access {feature} and unlock unlimited AI-powered analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Unlimited file uploads
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Unlimited AI analyses
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Advanced visualizations
            </li>
          </ul>
          <Button 
            className="w-full"
            onClick={() => setLocation("/pricing")}
            data-testid="button-paywall-upgrade"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro - $29/month
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

export function usePaywallCheck() {
  const { data: subscriptionData, isLoading } = useSubscription();
  const hasAccess = isSubscriptionActive(subscriptionData?.status);
  return { hasAccess, isLoading };
}
