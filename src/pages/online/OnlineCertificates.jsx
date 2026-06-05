import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Share2, Download, ExternalLink, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnlineCertificates() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500 mt-1">View, download, and share your earned credentials.</p>
        </div>
        <Button variant="outline" className="text-[#0056D2] border-[#0056D2] bg-white"><ExternalLink className="h-4 w-4 mr-2" /> Verify a Certificate</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[
          { title: "Machine Learning Specialization", issuer: "Stanford University", date: "Oct 15, 2023", credentialId: "ML-8932-XYZ", image: "https://images.unsplash.com/photo-1589330694653-0471c08af7e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
          { title: "Google Data Analytics Professional", issuer: "Google", date: "Aug 02, 2023", credentialId: "GDA-4512-ABC", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }
        ].map((cert, i) => (
          <Card key={i} className="border-0 shadow-md rounded-xl overflow-hidden bg-white">
            <div className="h-48 overflow-hidden relative border-b border-gray-100">
              <div className="absolute inset-0 bg-[#0056D2] opacity-10 mix-blend-multiply z-10"></div>
              <img src={cert.image} alt="Certificate Background" className="w-full h-full object-cover filter blur-[2px]" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-white/80 backdrop-blur-sm">
                <Award className="h-12 w-12 text-[#0056D2] mb-2" />
                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{cert.title}</h3>
                <p className="text-sm font-semibold text-gray-600 mt-1">{cert.issuer}</p>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Earned on</p>
                  <p className="font-semibold text-gray-900">{cert.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Credential ID</p>
                  <p className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">{cert.credentialId}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button className="flex-1 bg-[#0056D2] hover:bg-[#004bb5] text-white"><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
                <Button variant="outline" className="flex-1"><Share2 className="h-4 w-4 mr-2" /> Share to LinkedIn</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-2/3 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Digital Credentials Network</h2>
            <p className="text-gray-600">Your certificates are securely stored and independently verifiable on our blockchain-backed credential network. Anyone with your Credential ID can verify your achievement instantly.</p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Cryptographically secure</li>
              <li className="flex items-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> One-click LinkedIn integration</li>
              <li className="flex items-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Permanent URL for your resume</li>
            </ul>
          </div>
          <div className="md:w-1/3 flex justify-center">
             <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <Award className="h-16 w-16 text-[#0056D2]" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
