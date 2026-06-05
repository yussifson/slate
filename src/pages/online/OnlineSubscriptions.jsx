import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnlineSubscriptions() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-500 mt-4 text-lg">Choose the right plan to accelerate your learning journey. Upgrade, downgrade, or cancel anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Basic Plan */}
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl font-bold text-gray-900">Basic</CardTitle>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
              $0
              <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {['Access to free courses', 'Community forum access', 'Basic progress tracking'].map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button variant="outline" className="w-full text-[#0056D2] border-[#0056D2] hover:bg-blue-50">Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-2 border-[#0056D2] shadow-xl rounded-xl overflow-hidden relative bg-white transform scale-105 z-10">
          <div className="absolute top-0 left-0 right-0 bg-[#0056D2] text-white text-center text-sm font-bold py-1">MOST POPULAR</div>
          <CardHeader className="p-6 pb-0 pt-10">
            <CardTitle className="text-xl font-bold text-gray-900">Pro Learner</CardTitle>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
              $49
              <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {['Everything in Basic', 'Unlimited access to all courses', 'Earn Professional Certificates', 'Guided Projects', 'Priority Support'].map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#0056D2] mr-3 shrink-0" />
                  <span className="text-gray-800 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button className="w-full bg-[#0056D2] hover:bg-[#004bb5] text-white text-lg h-12">Upgrade Now</Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl font-bold text-gray-900">Teams</CardTitle>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
              $399
              <span className="ml-1 text-xl font-medium text-gray-500">/year</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Per user, billed annually</p>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {['Everything in Pro', 'Admin dashboard & analytics', 'Custom learning paths', 'SSO Integration', 'Dedicated Success Manager'].map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button variant="outline" className="w-full text-gray-700 border-gray-300">Contact Sales</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto mt-16 bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Billing History</h3>
          <p className="text-gray-500">View your past invoices and manage payment methods.</p>
        </div>
        <Button variant="outline">Manage Billing</Button>
      </div>
    </div>
  );
}
