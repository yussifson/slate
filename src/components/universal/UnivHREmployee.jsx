import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import FeatureGate from '@/components/ui/FeatureGate';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import{supabase}from"@/api/supabaseClient";
import{useCompanyId}from'@/hooks/useCompanyId';
import{Users,UserPlus,Search,Trash2,Edit2,XCircle,Mail,Phone,Building2,Briefcase,DollarSign,LayoutGrid,List,Network}from"lucide-react";
import{toast}from'react-hot-toast';
import{base44}from"@/api/base44Client";
import{OrbitLoader}from"@/components/ui/orbit-loader";

constEMPTY_FORM={first_name:'',last_name:'',email:'',phone:'',role_title:'',department:'',status:'Active',salary:'',employment_type:'Full-Time',hire_date:''};
constDEPARTMENTS=['General','Engineering','Marketing','Sales','Finance','HR','Operations','Legal','Design','Support'];
constgradients=['from-violet-500to-purple-600','from-cyan-500to-blue-600','from-emerald-500to-teal-600','from-orange-500to-amber-600','from-pink-500to-rose-600','from-indigo-500to-blue-700'];
constgrad=(n)=>gradients[(n||'A').charCodeAt(0)%gradients.length];
constinitials=(e)=>`${(e.first_name||'?').charAt(0)}${(e.last_name||'?').charAt(0)}`.toUpperCase();
conststatusColor=(s)=>s==='Active'?'bg-emerald-50text-emerald-700border-emerald-200':s==='Onboarding'?'bg-blue-50text-blue-700border-blue-200':'bg-mutedtext-[#71717a]dark:text-gray-400border-primary/40';

exportdefaultfunctionUnivHREmployee(){
constcompanyId=useCompanyId();
const[view,setView]=useState('Default');
const[employees,setEmployees]=useState([]);
const[loading,setLoading]=useState(true);
const[search,setSearch]=useState('');
const[viewMode,setViewMode]=useState('grid');
const[isModalOpen,setIsModalOpen]=useState(false);
const[editingId,setEditingId]=useState(null);
const[selected,setSelected]=useState(null);
const[form,setForm]=useState(EMPTY_FORM);
const[password,setPassword]=useState('');

useEffect(()=>{
if(companyId){
fetchEmps();
constch=supabase.channel('hr_ch').on('postgres_changes',{event:'*',schema:'public',table:'univ_hr_employees',filter:`company_id=eq.${companyId}`},fetchEmps).subscribe();
return()=>supabase.removeChannel(ch);
}
},[companyId]);

constfetchEmps=async()=>{
setLoading(true);
try{
const__res=awaitpowerSync.execute(`SELECT*FROMuniv_hr_employeesWHEREcompany_id=?ORDERBYnameASC`,[companyId]);
constdata=__res.rows?(__res.rows._array||Array.from(__res.rows)):[];
consterror=null;
if(error&&error.code!=='42P01')throwerror;
setEmployees(data||[]);
}catch(e){console.error(e);}finally{setLoading(false);}
};

constsave=async(e)=>{
e.preventDefault();
try{
constpayload={...form,company_id:companyId};
deletepayload.employment_type;//Notinphase1schema
if(!payload.hire_date)deletepayload.hire_date;
if(!payload.salary)deletepayload.salary;
elsepayload.salary=Number(payload.salary);

if(editingId){
await(async()=>{const_payload=payload;const_keys=Object.keys(_payload);const_vals=Object.values(_payload).map(v=>typeofv==='object'&&v!==null?JSON.stringify(v):v);awaitpowerSync.execute(`UPDATEuniv_hr_employeesSET${_keys.map(k=>k+'=?').join(',')}WHEREid=?`,[..._vals,editingId]);})();
consterror=null;constdata=[];
if(error)throwerror;
toast.success('Employeeupdated!');
}else{
if(!password){
toast.error('Temporarypasswordisrequired');
return;
}

constreg=awaitbase44.auth.register({
email:form.email,
password:password,
company_id:companyId,
role:form.role_title||'staff'});

if(reg?.user?.id){
payload.user_id=reg.user.id;
}

const{error}=await(async()=>{
const_payload=payload;
const_keys=Object.keys(_payload);
const_vals=Object.values(_payload).map(v=>typeofv==='object'&&v!==null?JSON.stringify(v):v);
const_plhdr=_keys.map(()=>'?').join(',');
awaitpowerSync.execute(`INSERTINTOuniv_hr_employees(${_keys.join(',')})VALUES(${_plhdr})`,_vals);return{error:null};})();
if(error)throwerror;
toast.success('Employeeaddedandaccountcreated!');
}
closeModal();fetchEmps();
}catch(err){console.error(err);toast.error(err.message||'Failedtosave');}
};

constremove=async(id)=>{
awaitpowerSync.execute(`DELETEFROMuniv_hr_employeesWHEREid=?`,[id]);
consterror=null;
if(error)toast.error('Failedtodelete');else{toast.success('Deleted');fetchEmps();setSelected(null);}
};

constopenModal=(emp=null)=>{setForm(emp?{...emp}:EMPTY_FORM);setEditingId(emp?.id||null);setPassword('');setIsModalOpen(true);};
constcloseModal=()=>{setIsModalOpen(false);setEditingId(null);setForm(EMPTY_FORM);setPassword('');};
constfiltered=employees.filter(e=>`${e.first_name}${e.last_name}${e.email}${e.department}${e.role_title}`.toLowerCase().includes(search.toLowerCase()));

return(
<divclassName="h-fullflexflex-colgap-6w-fullbg-backgroundp-4sm:p-6lg:p-8${view!=='Default'?'hide-default':''}">
<divclassName="view-headerflexflex-colsm:flex-rowjustify-betweenitems-startsm:items-centergap-4shrink-0">
<div><h1className="text-2xlfont-blacktext-foregroundtracking-tightflexitems-centergap-2tracking-[-0.02em]"><UsersclassName="w-7h-7text-primary"/>Employees</h1><pclassName="text-[#71717a]dark:text-gray-400text-smfont-mediummt-1">{employees.length}total•{employees.filter(e=>e.status==='Active').length}active</p></div>
<FeatureGatelimitName="users"fallbackType="disable"><buttononClick={()=>openModal()}className="h-10px-4bg-primarytext-whiterounded-xltext-smfont-semiboldflexitems-centergap-2hover:bg-primary/90"><UserPlusclassName="w-4h-4"/>AddEmployee</button></FeatureGate>
</div>

<divclassName="gridgrid-cols-2md:grid-cols-4gap-4shrink-0">
{[{label:'Total',value:employees.length,c:'text-foreground'},{label:'Active',value:employees.filter(e=>e.status==='Active').length,c:'text-emerald-600'},{label:'Onboarding',value:employees.filter(e=>e.status==='Onboarding').length,c:'text-blue-600'},{label:'Departments',value:[...newSet(employees.map(e=>e.department).filter(Boolean))].length,c:'text-violet-600'}].map((k,i)=><divkey={i}className="bg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40p-4rounded-2xlhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200"><pclassName="text-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasetracking-widermb-1tracking-[0.04em]">{k.label}</p><pclassName={`text-2xlfont-black${k.c}`}>{k.value}</p></div>)}
</div>

<divclassName="flexgap-3shrink-0">
<divclassName="relativeflex-1"><SearchclassName="w-5h-5absoluteleft-3top-1/2-translate-y-1/2text-[#71717a]dark:text-gray-400"/><inputtype="text"value={search}onChange={e=>setSearch(e.target.value)}placeholder="Searchemployees..."className="w-fullh-11pl-10pr-4bg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-smhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200"/></div>
<divclassName="flexbg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlp-1gap-2hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200">
<buttononClick={()=>setViewMode('grid')}className={`px-3py-1.5rounded-xltext-smfont-semiboldflexitems-centergap-2.5${viewMode==='grid'?'bg-primarytext-white':'text-[#71717a]dark:text-gray-400'}`}><LayoutGridclassName="w-4h-4"/>Grid</button>
<buttononClick={()=>setViewMode('list')}className={`px-3py-1.5rounded-xltext-smfont-semiboldflexitems-centergap-2.5${viewMode==='list'?'bg-primarytext-white':'text-[#71717a]dark:text-gray-400'}`}><ListclassName="w-4h-4"/>List</button>
<buttononClick={()=>setViewMode('orgchart')}className={`px-3py-1.5rounded-xltext-smfont-semiboldflexitems-centergap-2.5${viewMode==='orgchart'?'bg-primarytext-white':'text-[#71717a]dark:text-gray-400'}`}><NetworkclassName="w-4h-4"/>OrgChart</button>
</div>
</div>

<divclassName="flex-1overflow-automin-h-0custom-scrollbar">
{loading?<divclassName="flexh-40items-centerjustify-center"><OrbitLoadersize="md"/></div>
:viewMode==='grid'?(
<divclassName="gridgrid-cols-1sm:grid-cols-2lg:grid-cols-3xl:grid-cols-4gap-4pb-8">
{filtered.map(emp=>(
<divkey={emp.id}onClick={()=>setSelected(emp)}className="bg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-2xlp-5transition-allgroupcursor-pointerhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200">
<divclassName="flexflex-colitems-centertext-center">
<divclassName={`w-16h-16rounded-fullbg-gradient-to-br${grad(emp.name)}flexitems-centerjustify-centertext-whitetext-xlfont-blackmb-3`}>{initials(emp)}</div>
<h3className="font-semiboldtext-basetext-foreground">{emp.name}{emp.name}</h3>
<pclassName="text-smfont-mediumtext-primarymt-0.5">{emp.role_title||'Staff'}</p>
<pclassName="text-xstext-[#71717a]dark:text-gray-400tracking-[0.04em]">{emp.department||'—'}</p>
<divclassName="mt-3w-fullpt-3border-tborder-primary/40flexjustify-betweenitems-center">
<spanclassName={`px-2py-0.5text-[10px]font-semibolduppercaseborder-[0.5px]border-black/9dark:border-white/8rounded-lg${statusColor(emp.status)}`}>{emp.status}</span>
<divclassName="flexgap-2opacity-0group-hover:opacity-100transition-opacity">
<buttononClick={e=>{e.stopPropagation();openModal(emp);}}className="p-1bg-mutedrounded-lgtext-[#71717a]dark:text-gray-400hover:text-primary"><Edit2className="w-3h-3"/></button>
<buttononClick={e=>{e.stopPropagation();remove(emp.id);}}className="p-1bg-red-50rounded-lgtext-red-400hover:text-red-600"><Trash2className="w-3h-3"/></button>
</div>
</div>
</div>
</div>
))}
{filtered.length===0&&<divclassName="col-span-fullpy-20text-centertext-[#71717a]dark:text-gray-400border-2border-dashedborder-primary/40rounded-2xl"><UsersclassName="w-12h-12mx-autotext-[#71717a]dark:text-gray-400/30mb-3"/><pclassName="font-medium">Noemployeesfound.</p></div>}
</div>
):viewMode==='list'?(
<divclassName="bg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-2xloverflow-hiddenhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200">
<tableclassName="w-fulltext-sm">
<theadclassName="bg-muted/50border-bborder-primary/40"><tr>{['Employee','Role/Dept','Contact','Type','Status','Actions'].map(h=><thkey={h}className="p-4text-lefttext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasetracking-widertracking-[0.04em]">{h}</th>)}</tr></thead>
<tbodyclassName="divide-ydivide-border">
{filtered.map(emp=>(
<trkey={emp.id}className="hover:bg-muted/30transition-colorsgroupcursor-pointer"onClick={()=>setSelected(emp)}>
<tdclassName="p-4"><divclassName="flexitems-centergap-3"><divclassName={`w-9h-9rounded-fullbg-gradient-to-br${grad(emp.name)}flexitems-centerjustify-centertext-whitetext-xsfont-blackshrink-0`}>{initials(emp)}</div><div><pclassName="font-semiboldtext-foreground">{emp.name}{emp.name}</p><pclassName="text-xstext-[#71717a]dark:text-gray-400tracking-[0.04em]">{emp.hire_date?`Hired${emp.hire_date}`:''}</p></div></div></td>
<tdclassName="p-4"><pclassName="font-medium">{emp.role_title||'—'}</p><pclassName="text-xstext-[#71717a]dark:text-gray-400tracking-[0.04em]">{emp.department||'—'}</p></td>
<tdclassName="p-4text-xstext-[#71717a]dark:text-gray-400tracking-[0.04em]"><divclassName="flexflex-colgap-2">{emp.email&&<spanclassName="flexitems-centergap-2"><MailclassName="w-3h-3"/>{emp.email}</span>}{emp.phone&&<spanclassName="flexitems-centergap-2"><PhoneclassName="w-3h-3"/>{emp.phone}</span>}</div></td>
<tdclassName="p-4text-smtext-[#71717a]dark:text-gray-400">{emp.employment_type||'Full-Time'}</td>
<tdclassName="p-4"><spanclassName={`px-2py-0.5text-[10px]font-semibolduppercaseborder-[0.5px]border-black/9dark:border-white/8rounded-lg${statusColor(emp.status)}`}>{emp.status}</span></td>
<tdclassName="p-4"><divclassName="flexgap-2opacity-0group-hover:opacity-100transition-opacity"><buttononClick={e=>{e.stopPropagation();openModal(emp);}}className="p-1.5bg-mutedrounded-lgtext-[#71717a]dark:text-gray-400hover:text-primary"><Edit2className="w-3.5h-3.5"/></button><buttononClick={e=>{e.stopPropagation();remove(emp.id);}}className="p-1.5bg-red-50rounded-lgtext-red-400hover:text-red-600"><Trash2className="w-3.5h-3.5"/></button></div></td>
</tr>
))}
{filtered.length===0&&<tr><tdcolSpan={6}className="p-12text-centertext-[#71717a]dark:text-gray-400">Noemployeesfound.</td></tr>}
</tbody>
</table>
</div>
):viewMode==='orgchart'?(
<divclassName="bg-cardborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-2xlp-8overflow-autotext-centermin-h-[500px]flexjustify-centerhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200">
<divclassName="inline-flexflex-colitems-center">
<divclassName="px-6py-3bg-primarytext-whiterounded-2xlfont-blacktext-lgrelativez-10mb-8">
CEO/Founder
<divclassName="w-pxh-8bg-primary/40absoluteleft-1/2-translate-x-1/2top-full"></div>
</div>
<divclassName="flexgap-8justify-centerborder-t-2border-primary/40pt-8relative">
<divclassName="w-[calc(100%-2rem)]h-0.5bg-primary/40absolutetop-0left-4"></div>
{DEPARTMENTS.slice(0,4).map(dept=>{
constdeptEmps=filtered.filter(e=>e.department===dept);
if(deptEmps.length===0)returnnull;
return(
<divkey={dept}className="flexflex-colitems-centerrelative">
<divclassName="w-pxh-8bg-primary/40absoluteleft-1/2-translate-x-1/2-top-8"></div>
<divclassName="px-5py-2bg-mutedtext-foregroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfont-semiboldtext-smmb-6relativez-10">
{dept}Head
<divclassName="w-pxh-6bg-primary/40absoluteleft-1/2-translate-x-1/2top-full"></div>
</div>
<divclassName="flexflex-colgap-3">
{deptEmps.map(emp=>(
<divkey={emp.id}onClick={()=>setSelected(emp)}className="w-48p-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xltext-centercursor-pointerhover:border-primarytransition-colorsrelativez-10">
<divclassName={`w-10h-10mx-autorounded-fullbg-gradient-to-br${grad(emp.name)}flexitems-centerjustify-centertext-whitetext-xsfont-blackmb-2`}>{initials(emp)}</div>
<h4className="font-semiboldtext-xstruncatetracking-[0.04em]">{emp.name}{emp.name}</h4>
<pclassName="text-[10px]text-[#71717a]dark:text-gray-400truncate">{emp.role_title}</p>
</div>
))}
</div>
</div>
);
})}
</div>
</div>
</div>
):null}
</div>

{selected&&(
<divclassName="fixedinset-0z-40bg-primary/20backdrop-blur-sm"onClick={()=>setSelected(null)}>
<divclassName="absoluteright-0top-0bottom-0w-80bg-cardborder-lborder-primary/40flexflex-colhover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200"onClick={e=>e.stopPropagation()}>
<divclassName="p-5border-bborder-primary/40flexjustify-betweenitems-center"><h3className="font-blacktext-lg">Profile</h3><buttononClick={()=>setSelected(null)}className="p-1.5bg-mutedrounded-full"><XCircleclassName="w-4h-4text-[#71717a]dark:text-gray-400"/></button></div>
<divclassName="flex-1overflow-y-autop-5custom-scrollbar">
<divclassName="flexflex-colitems-centertext-centermb-5"><divclassName={`w-20h-20rounded-fullbg-gradient-to-br${grad(selected.first_name)}flexitems-centerjustify-centertext-whitetext-2xlfont-blackmb-3`}>{initials(selected)}</div><h3className="font-blacktext-xl">{selected.first_name}{selected.last_name}</h3><pclassName="text-primaryfont-semibold">{selected.role_title}</p><spanclassName={`mt-2px-3py-1text-[11px]font-semibolduppercaseborder-[0.5px]border-black/9dark:border-white/8rounded-full${statusColor(selected.status)}`}>{selected.status}</span></div>
<divclassName="space-y-2">{[{icon:<Building2className="w-4h-4"/>,label:'Department',value:selected.department},{icon:<BriefcaseclassName="w-4h-4"/>,label:'Type',value:selected.employment_type},{icon:<MailclassName="w-4h-4"/>,label:'Email',value:selected.email},{icon:<PhoneclassName="w-4h-4"/>,label:'Phone',value:selected.phone},{icon:<DollarSignclassName="w-4h-4"/>,label:'Salary',value:selected.salary?`$${Number(selected.salary).toLocaleString()}`:null}].map((f,i)=>f.value?(<divkey={i}className="flexitems-centergap-3p-3bg-muted/40rounded-xl"><spanclassName="text-primaryshrink-0">{f.icon}</span><div><pclassName="text-[10px]font-semiboldtext-[#71717a]dark:text-gray-400uppercasetracking-[0.04em]">{f.label}</p><pclassName="text-smfont-medium">{f.value}</p></div></div>):null)}</div>
</div>
<divclassName="p-5border-tborder-primary/40flexgap-2">
<buttononClick={()=>{openModal(selected);setSelected(null);}}className="flex-1h-9bg-primarytext-whiterounded-xltext-smfont-semiboldflexitems-centerjustify-centergap-2"><Edit2className="w-3.5h-3.5"/>Edit</button>
<buttononClick={()=>remove(selected.id)}className="flex-1h-9bg-red-50text-red-600border-[0.5px]border-black/9dark:border-white/8border-red-200rounded-xltext-smfont-semiboldflexitems-centerjustify-centergap-2hover:bg-red-100"><Trash2className="w-3.5h-3.5"/>Delete</button>
</div>
</div>
</div>
)}

{isModalOpen&&(
<divclassName="fixedinset-0z-50flexitems-centerjustify-centerp-4bg-primary/20backdrop-blur-sm">
<divclassName="bg-cardw-fullmax-w-2xlrounded-2xlflexflex-colmax-h-[90vh]hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]transition-shadowduration-200">
<divclassName="p-5border-bborder-primary/40flexjustify-betweenitems-centershrink-0"><h2className="text-xlfont-black">{editingId?'EditEmployee':'AddEmployee'}</h2><buttononClick={closeModal}className="p-2bg-mutedrounded-fulltext-[#71717a]dark:text-gray-400"><XCircleclassName="w-5h-5"/></button></div>
<formonSubmit={save}className="p-5overflow-y-autoflex-1custom-scrollbar">
<divclassName="gridgrid-cols-2gap-4">
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">FirstName*</label><inputrequiredtype="text"value={form.first_name}onChange={e=>setForm({...form,first_name:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">LastName*</label><inputrequiredtype="text"value={form.last_name}onChange={e=>setForm({...form,last_name:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Email*</label><inputrequiredtype="email"value={form.email}onChange={e=>setForm({...form,email:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"disabled={!!editingId}/></div>
{!editingId&&(
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">TempPassword*</label><inputrequiredtype="text"value={password}onChange={e=>setPassword(e.target.value)}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"placeholder="Min6characters"/></div>
)}
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Phone</label><inputtype="tel"value={form.phone}onChange={e=>setForm({...form,phone:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Role/Title</label><inputtype="text"value={form.role_title}onChange={e=>setForm({...form,role_title:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Department</label><selectvalue={form.department}onChange={e=>setForm({...form,department:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"><optionvalue="">Select...</option>{DEPARTMENTS.map(d=><optionkey={d}>{d}</option>)}</select></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">EmploymentType</label><selectvalue={form.employment_type}onChange={e=>setForm({...form,employment_type:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"><option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option></select></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Status</label><selectvalue={form.status}onChange={e=>setForm({...form,status:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"><option>Active</option><option>Onboarding</option><option>OnLeave</option><option>Terminated</option></select></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">Salary($)</label><inputtype="number"min="0"value={form.salary}onChange={e=>setForm({...form,salary:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
<div><labelclassName="blocktext-xsfont-semiboldtext-[#71717a]dark:text-gray-400uppercasemb-1.5tracking-[0.04em]">HireDate</label><inputtype="date"value={form.hire_date}onChange={e=>setForm({...form,hire_date:e.target.value})}className="w-fullh-10px-3bg-backgroundborder-[0.5px]border-black/9dark:border-white/8border-primary/40rounded-xlfocus:ring-2focus:ring-primary/40focus:outline-nonetext-sm"/></div>
</div>
<divclassName="flexjustify-endgap-3mt-6pt-5border-tborder-primary/40"><buttontype="button"onClick={closeModal}className="h-10px-5bg-mutedrounded-xltext-smfont-medium">Cancel</button><buttontype="submit"className="h-10px-5bg-primarytext-whiterounded-xltext-smfont-semibold">{editingId?'Update':'AddEmployee'}</button></div>
</form>
</div>
</div>
)}
</div>
);
}
