import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Copy, DollarSign, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function OnlineAffiliates() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate System</h1>
          <p className="text-gray-500 mt-1">Manage referrals, track commissions, and grow your reach.</p>
        </div>
        <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white">Invite Affiliates</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Affiliates</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">145</h3>
                  <span className="text-sm font-medium text-green-600 mb-1">+12</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-[#0056D2] rounded-lg">
                <Link className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">1,240</h3>
                  <span className="text-sm font-medium text-green-600 mb-1">+85</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Commissions Paid</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">$12,450</h3>
                  <span className="text-sm font-medium text-gray-500 mb-1">Lifetime</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Your Referral Link</CardTitle>
            <CardDescription>Share this link to earn 20% on every new student you refer.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value="https://learn.airflake.com/ref/ins_8932" readOnly className="bg-gray-50 text-gray-700 font-mono" />
              <Button variant="outline" className="shrink-0"><Copy className="h-4 w-4 mr-2" /> Copy</Button>
            </div>
            
            <div className="mt-8 space-y-4">
              <h4 className="font-semibold text-gray-900">Reward Tiers</h4>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Silver (10 referrals) - 20% commission</span>
                  <span className="text-gray-500">8/10</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Gold (50 referrals) - 25% commission</span>
                  <span className="text-gray-400">8/50</span>
                </div>
                <Progress value={16} className="h-2 bg-gray-100 [&>div]:bg-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Top Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Tech Blog Daily", referrals: 342, rev: "$6,840" },
                { name: "Sarah Codes", referrals: 156, rev: "$3,120" },
                { name: "Data Science Hub", referrals: 98, rev: "$1,960" },
              ].map((a, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-[#0056D2] font-bold flex items-center justify-center">
                      #{i+1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{a.name}</h4>
                      <p className="text-sm text-gray-500">{a.referrals} referrals</p>
                    </div>
                  </div>
                  <div className="font-bold text-green-600">{a.rev}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
