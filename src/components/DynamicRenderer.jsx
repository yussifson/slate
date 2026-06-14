import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// A powerful Server-Driven UI Renderer that interprets JSON directly into Tailwind components
export default function DynamicRenderer({ schema }) {
  if (!schema) return null;

  const renderNode = (node, index) => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map((n, i) => renderNode(n, i));

    const { type, props = {}, children, layout, design } = node;

    // Helper to get Lucide Icons
    const renderIcon = (iconName) => {
      if (!iconName) return null;
      const IconComp = Icons[iconName];
      return IconComp ? <IconComp className="w-5 h-5" /> : null;
    };

    switch (type) {
      case 'Page':
      case 'Container':
        const layoutClasses = {
          'Grid': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
          'FlexRow': 'flex flex-row gap-4',
          'FlexCol': 'flex flex-col gap-6',
          'Dashboard': 'grid grid-cols-1 md:grid-cols-12 gap-6'
        }[layout] || 'space-y-6';
        
        return (
          <div key={index} className={`w-full ${layoutClasses} ${props.className || ''}`}>
            {children && renderNode(children)}
          </div>
        );

      case 'StatCard':
        const colorClasses = {
          blue: 'bg-blue-50 text-blue-600',
          emerald: 'bg-emerald-50 text-emerald-600',
          purple: 'bg-purple-50 text-purple-600',
          amber: 'bg-amber-50 text-amber-600',
          red: 'bg-red-50 text-red-600'
        }[props.color] || 'bg-muted text-foreground';

        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={index} className={props.className || (layout === 'Dashboard' ? 'col-span-1 md:col-span-3' : '')}>
            <Card className={design === 'glassmorphism' ? 'bg-background/60 backdrop-blur-md border-border/50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{props.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{props.value}</h3>
                    {props.subtitle && <p className="text-xs text-muted-foreground mt-1">{props.subtitle}</p>}
                  </div>
                  <div className={`p-3 rounded-2xl ${colorClasses}`}>
                    {renderIcon(props.icon || 'Activity')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'Chart':
        const ChartComp = props.chartType === 'Bar' ? BarChart : LineChart;
        const DataComp = props.chartType === 'Bar' ? Bar : Line;
        return (
          <Card key={index} className={`overflow-hidden ${props.className || (layout === 'Dashboard' ? 'col-span-1 md:col-span-8' : '')}`}>
            <CardHeader>
              <CardTitle className="text-lg">{props.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartComp data={props.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <DataComp 
                      type="monotone" 
                      dataKey="value" 
                      stroke={props.color || "#4f46e5"} 
                      fill={props.color || "#4f46e5"} 
                      strokeWidth={3} 
                      radius={[4,4,0,0]} 
                    />
                  </ChartComp>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'Form':
        return (
          <Card key={index} className={props.className || (layout === 'Dashboard' ? 'col-span-1 md:col-span-4' : '')}>
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                {children && renderNode(children)}
                <Button className="w-full mt-2" type="submit">{props.submitLabel || 'Submit'}</Button>
              </form>
            </CardContent>
          </Card>
        );
        
      case 'Input':
        return (
          <div key={index} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{props.label}</label>
            <Input type={props.inputType || 'text'} placeholder={props.placeholder} />
          </div>
        );

      case 'Table':
        return (
          <Card key={index} className={props.className || (layout === 'Dashboard' ? 'col-span-1 md:col-span-12' : '')}>
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      {props.columns?.map((col, i) => <th key={i} className="px-4 py-3 font-semibold">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {props.data?.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {props.columns?.map((col, j) => (
                          <td key={j} className="px-4 py-3">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );

      default:
        // Render unknown components as simple divs or ignore them
        if (children) {
          return <div key={index} className={props.className}>{renderNode(children)}</div>;
        }
        return <div key={index} className="text-red-500 text-xs">Unknown component type: {type}</div>;
    }
  };

  return <div className="dynamic-renderer-root w-full">{renderNode(schema)}</div>;
}
