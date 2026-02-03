import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/stripe/subscription"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Noema Pro!</CardTitle>
          <CardDescription>
            Your subscription is now active. You have unlimited access to all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">What's included:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Unlimited file uploads</li>
              <li>Unlimited AI analyses</li>
              <li>Advanced visualizations</li>
              <li>Export to PDF & Excel</li>
              <li>Priority support</li>
            </ul>
          </div>
          <Button 
            className="w-full" 
            onClick={() => setLocation("/")}
            data-testid="button-go-to-dashboard"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
