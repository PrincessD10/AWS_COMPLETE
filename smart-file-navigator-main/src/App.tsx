
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AwsAuthProvider } from "@/hooks/useAwsAuth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import AWSDeploymentGuide from "@/components/deployment/AWSDeploymentGuide";
import PostDeploymentSteps from "@/components/deployment/PostDeploymentSteps";
import DeploymentTester from "@/components/testing/DeploymentTester";
//import TestingGuide from "@/components/testing/TestingGuide";
import ApiTester from "@/components/testing/ApiTester";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AwsAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/aws-deployment" element={<AWSDeploymentGuide />} />
            <Route path="/post-deployment" element={<PostDeploymentSteps />} />
            <Route path="/deployment-tester" element={<DeploymentTester />} />
            {/*<Route path="/testing-guide" element={<TestingGuide />} />/*/}
            <Route path="/api-tester" element={<ApiTester />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AwsAuthProvider>
  </QueryClientProvider>
);

export default App;
