import React from "react";
import { List, Edit, Trash2, Eye} from "lucide-react";
import { Button} from "@/components/ui/button";
import { cn} from "@/lib/utils";

/** Brand blue palette — matches --primary (221 83% 53%) */
export const RETAIL_BRAND = {
 primary: "hsl(221, 83%, 53%)",
 primaryDark: "hsl(221, 83%, 45%)",
 primaryLight: "hsl(221, 83%, 96%)",
 chart: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#1e40af"]};

export function ViewModeToggle({ viewMode, onChange, className}) {
 return (
 <div className={cn("bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-1 rounded-xl flex items-center ", className)}>
 <button
 type="button"
 onClick={() => onChange("list")}
 className={cn(
 "p-2 rounded-lg transition-colors",
 viewMode === "list" ? "bg-primary text-primary-foreground" : "text-[#71717a] dark:text-gray-400 hover:bg-muted"
 )}
 title="List view"
 >
 <List className="w-4 h-4" />
 </button>
 </div>
 );
}

export function RetailStatCard({ label, value, icon: Icon, hint, variant = "default"}) {
 const variants = {
 default: "bg-slate-100 text-primary",
 warning: "bg-amber-500/10 text-amber-600",
 danger: "bg-red-500/10/10 text-red-600",
 success: "bg-slate-100 text-primary"};
 return (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 min-h-[88px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", variants[variant])}>
 <Icon className="w-6 h-6" />
 </div>
 <div className="min-w-0">
 <p className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{value}</p>
 <p className="text-xs font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-wide tracking-[0.04em]">{label}</p>
 {hint && <p className="text-[11px] text-primary mt-0.5 font-medium">{hint}</p>}
 </div>
 </div>
 );
}

export function RetailPageHeader({ title, subtitle, actions}) {
 return (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{title}</h1>
 {subtitle && <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{subtitle}</p>}
 </div>
 {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
 </div>
 );
}

export function RetailGridShell({ children, empty, isLoading, loadingText = "Loading..."}) {
 if (isLoading) {
 return <div className="py-16 text-center text-[#71717a] dark:text-gray-400">{loadingText}</div>;
}
 if (empty) return empty;
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {children}
 </div>
 );
}

function CardActions({ onEdit, onDelete, onView}) {
 return (
 <div className="absolute top-3 right-3 flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
 {onView && (
 <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 " onClick={onView}>
 <Eye className="w-3.5 h-3.5" />
 </Button>
 )}
 {onEdit && (
 <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 " onClick={onEdit}>
 <Edit className="w-3.5 h-3.5" />
 </Button>
 )}
 {onDelete && (
 <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 text-red-600" onClick={onDelete}>
 <Trash2 className="w-3.5 h-3.5" />
 </Button>
 )}
 </div>
 );
}

export function ProductGridCard({ product, onEdit, onDelete, suppliers = []}) {
 const supplierName = suppliers.find((s) => s.id === product.supplierId)?.name;
 const inStock = product.stock > 0;
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col min-h-[320px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/40 flex items-center justify-center relative">
 <div className="w-20 h-20 rounded-2xl bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center text-primary/40">
 {product.image ? (
 <img src={product.image} alt="" className="w-full h-full object-cover rounded-2xl" />
 ) : (
 <span className="text-4xl font-semibold text-primary/30 tracking-[-0.02em]">{product.name?.[0]?.toUpperCase()}</span>
 )}
 </div>
 <span
 className={cn(
 "absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border",
 inStock ? "bg-slate-100 text-primary border-primary/20" : "bg-red-50 text-red-700 border-red-200"
 )}
 >
 {inStock ? `${product.stock} in stock` : "Out of stock"}
 </span>
 <CardActions onEdit={onEdit} onDelete={onDelete} />
 </div>
 <div className="p-5 flex flex-col flex-1">
 <p className="text-xs font-semibold text-primary mb-1 tracking-[0.04em]">{product.category || "General"}</p>
 <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2">{product.name}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono mt-1 tracking-[0.04em]">{product.sku}</p>
 {supplierName && <p className="text-xs text-[#71717a] dark:text-gray-400 mt-2 tracking-[0.04em]">Supplier: {supplierName}</p>}
 <div className="mt-auto pt-4 border-t border-primary/40 flex items-end justify-between">
 <p className="text-2xl font-extrabold text-primary tracking-[-0.02em]">${Number(product.price || 0).toFixed(2)}</p>
 </div>
 </div>
 </article>
 );
}

export function PromotionGridCard({ promo, onEdit, onDelete}) {
 const active = promo.isActive !== false && promo.data?.isActive !== false;
 const type = promo.discountType || promo.data?.discountType || "percentage";
 const value = promo.discountValue ?? promo.data?.discountValue ?? 0;
 const code = promo.code || promo.data?.code || "PROMO";
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-2xl overflow-hidden hover:border-solid hover:border-primary/40 transition-all flex flex-col min-h-[220px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex-1 p-6 relative">
 <div className="flex justify-between items-start mb-6">
 <div className="bg-slate-100 text-primary text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-2.5 tracking-[0.04em]">
 <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
 {active ? "Active Code" : "Inactive Code"}
 </div>
 <CardActions onEdit={onEdit} onDelete={onDelete} />
 </div>
 
 <div className="mb-2">
 <p className="text-4xl font-black text-foreground tracking-tight tracking-[-0.02em]">{type === "percentage" ? `${value}%` : `$${value}`}</p>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mt-1 tracking-[0.04em]">Discount</p>
 </div>
 </div>
 
 <div className="h-16 bg-muted/40 border-t border-dashed border-primary/40 px-6 flex items-center justify-between relative overflow-hidden">
 <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-dashed z-10" />
 <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-dashed z-10" />
 
 <p className="font-mono text-lg font-semibold text-primary tracking-widest">{code}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{type}</p>
 </div>
 </article>
 );
}

export function CustomerGridCard({ customer, onEdit, onDelete, onView, segmentColors = {}}) {
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 hover:-translate-y-1 transition-all flex flex-col min-h-[260px] text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-3 right-3">
 <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
 </div>
 
 <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 border-4 border-background flex items-center justify-center text-3xl font-black text-primary mb-4 shrink-0 relative tracking-[-0.02em]">
 {customer.name?.[0]?.toUpperCase()}
 {customer.segment === 'VIP' && (
 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-background flex items-center justify-center ">
 <span className="text-[10px]">⭐</span>
 </div>
 )}
 </div>
 
 <div className="min-w-0 flex-1 mb-6">
 <h3 className="font-semibold text-xl text-foreground truncate">{customer.name}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono mt-1 tracking-[0.04em]">{customer.custId || customer.id}</p>
 <p className="text-sm text-primary/80 truncate mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full">{customer.email}</p>
 </div>
 
 <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-primary/40">
 <div className="text-center">
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">Lifetime</p>
 <p className="text-lg font-extrabold text-foreground">${Number(customer.totalSpent || 0).toFixed(2)}</p>
 </div>
 <div className="text-center border-l border-primary/40">
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">Orders</p>
 <p className="text-lg font-extrabold text-foreground">{customer.orders || 0}</p>
 </div>
 </div>
 </article>
 );
}

export function OrderGridCard({ order, onEdit, onDelete}) {
 const statusStyles = {
 Completed: "bg-slate-100 text-primary/90",
 Pending: "bg-amber-500/10 text-amber-700",
 Cancelled: "bg-red-500/10/10 text-red-600",
 Processing: "bg-slate-100 text-primary/90"};
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-0 transition-all flex flex-col min-h-[220px] overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="bg-muted/30 p-5 border-b border-primary/40 flex justify-between items-start relative">
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Receipt No.</p>
 <p className="text-lg font-mono font-semibold text-foreground">{order.orderId}</p>
 </div>
 <CardActions onEdit={onEdit} onDelete={onDelete} />
 </div>
 
 <div className="p-5 flex-1 flex flex-col">
 <div className="flex justify-between items-center mb-4">
 <p className="text-sm font-semibold text-foreground truncate">{order.customerName}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{order.date}</p>
 </div>
 
 <div className="mt-auto pt-4 border-t border-dashed border-primary/40 flex items-end justify-between">
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Amount Due</p>
 <p className="text-3xl font-extrabold text-primary tracking-[-0.02em]">${Number(order.total || 0).toFixed(2)}</p>
 </div>
 <span className={cn("text-[10px] font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wider", statusStyles[order.status] || "bg-muted text-[#71717a] dark:text-gray-400")}>
 {order.status}
 </span>
 </div>
 </div>
 </article>
 );
}

export function InventoryGridCard({ item, onEdit, onDelete, onView}) {
 const statusClass = {
 "In Stock": "bg-slate-100 text-primary border-primary/20",
 "Low Stock": "bg-amber-500/10 text-amber-700 border-amber-200",
 "Out of Stock": "bg-red-500/10/10 text-red-700 border-red-200"};
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col min-h-[280px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="h-32 bg-muted/30 border-b border-primary/40 flex items-center justify-center relative">
 <span className="text-5xl font-black text-primary/20 tracking-[-0.02em]">{item.name?.[0]}</span>
 <span className={cn("absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border-[0.5px] border-black/9 dark:border-white/8 uppercase", statusClass[item.status])}>
 {item.status}
 </span>
 <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
 </div>
 <div className="p-5 flex-1 flex flex-col">
 <p className="text-xs font-semibold text-primary tracking-[0.04em]">{item.category}</p>
 <h3 className="font-semibold text-lg leading-tight mt-1 line-clamp-2">{item.name}</h3>
 <p className="text-xs font-mono text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">{item.sku}</p>
 <div className="mt-auto pt-4 border-t border-primary/40 grid grid-cols-2 gap-2 text-sm">
 <div>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Price</p>
 <p className="font-semibold text-primary">${item.price?.toFixed(2)}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Qty</p>
 <p className="font-semibold">{item.quantity}</p>
 </div>
 </div>
 </div>
 </article>
 );
}

export function SupplierGridCard({ supplier, onEdit, onDelete, onView}) {
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 hover:border-primary/30 transition-all flex flex-col min-h-[220px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
 <span className="text-xl font-semibold">{supplier.name?.[0]}</span>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-lg line-clamp-1">{supplier.name}</h3>
 <p className="text-xs text-primary font-semibold tracking-[0.04em]">{supplier.category}</p>
 </div>
 <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
 </div>
 <div className="mt-4 space-y-1 text-sm text-[#71717a] dark:text-gray-400">
 <p className="truncate">{supplier.contact}</p>
 <p className="truncate">{supplier.email}</p>
 </div>
 <div className="mt-auto pt-4 border-t border-primary/40 flex items-center justify-between">
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Rating</span>
 <span className="font-semibold text-primary">{supplier.rating || 5}/5</span>
 </div>
 </article>
 );
}

export function LoyaltyGridCard({ member, onEdit, onDelete}) {
 const tierColors = {
 Bronze: "bg-amber-700/10 text-amber-800",
 Silver: "bg-slate-500/10 text-slate-700",
 Gold: "bg-slate-100 text-primary",
 Platinum: "bg-slate-100 text-primary/70"};
 return (
 <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-6 hover:border-primary/30 transition-all min-h-[180px] flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-semibold text-primary uppercase tracking-[0.04em]">{member.memberId}</p>
 <h3 className="font-semibold text-lg mt-1">{member.customerName}</h3>
 </div>
 <CardActions onEdit={onEdit} onDelete={onDelete} />
 </div>
 <div className="mt-auto pt-4 flex items-end justify-between">
 <div>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">Points</p>
 <p className="text-2xl font-black text-primary tracking-[-0.02em]">{member.points?.toLocaleString()}</p>
 </div>
 <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", tierColors[member.tier] || "bg-slate-100 text-primary")}>
 {member.tier}
 </span>
 </div>
 </article>
 );
}
