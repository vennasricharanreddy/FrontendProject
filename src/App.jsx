import { useEffect, useState } from "react";

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const cash = n => "₹" + Number(n || 0).toLocaleString("en-IN", {maximumFractionDigits:2});

function App() {
  const [users,setUsers]=useState(()=>read("splitwiseUsers",[
    {id:"admin",name:"Administrator",email:"admin@splitwise.com",password:"admin123",role:"admin"},
    {id:"farhan",name:"Farhan",email:"farhan@gmail.com",password:"1234",role:"user"},
    {id:"rahul",name:"Rahul",email:"rahul@gmail.com",password:"1234",role:"user"}
  ]));
  const [groups,setGroups]=useState(()=>read("splitwiseGroups",[]));
  const [expenses,setExpenses]=useState(()=>read("splitwiseExpenses",[]));
  const [settlements,setSettlements]=useState(()=>read("splitwiseSettlements",[]));
  const [me,setMe]=useState(()=>read("splitwiseCurrentUser",null));
  const [page,setPage]=useState("Dashboard");
  const [message,setMessage]=useState("");
  const [authMode,setAuthMode]=useState("login");
  const [auth,setAuth]=useState({name:"",email:"",password:"",confirm:""});
  const [groupName,setGroupName]=useState("");
  const [groupMembers,setGroupMembers]=useState([]);
  const [expense,setExpense]=useState({groupId:"",description:"",amount:"",paidBy:"",participants:[]});
  const [payment,setPayment]=useState({from:"",to:"",amount:"",note:""});

  useEffect(()=>{localStorage.setItem("splitwiseUsers",JSON.stringify(users));},[users]);
  useEffect(()=>{localStorage.setItem("splitwiseGroups",JSON.stringify(groups));},[groups]);
  useEffect(()=>{localStorage.setItem("splitwiseExpenses",JSON.stringify(expenses));},[expenses]);
  useEffect(()=>{localStorage.setItem("splitwiseSettlements",JSON.stringify(settlements));},[settlements]);
  const notify = text => { setMessage(text); setTimeout(()=>setMessage(""),2600); };
  const visibleGroups = me?.role==="admin" ? groups : groups.filter(g=>g.members.includes(me?.id));
  const visibleExpenses = expenses.filter(e=>visibleGroups.some(g=>g.id===e.groupId));

  function submitAuth(e) {
    e.preventDefault();
    if(authMode==="signup") {
      if(auth.name.trim().length<2 || auth.password.length<4) return notify("Enter a name and a password of at least 4 characters.");
      if(auth.password!==auth.confirm) return notify("Passwords do not match.");
      if(users.some(u=>u.email.toLowerCase()===auth.email.toLowerCase())) return notify("Email already registered.");
      const u={id:id(),name:auth.name.trim(),email:auth.email.toLowerCase(),password:auth.password,role:"user"};
      setUsers(old=>[...old,u]); setMe(u); localStorage.setItem("splitwiseCurrentUser",JSON.stringify(u)); setAuth({name:"",email:"",password:"",confirm:""});
    } else {
      const u=users.find(x=>x.email.toLowerCase()===auth.email.toLowerCase() && x.password===auth.password);
      if(!u) return notify("Incorrect email or password.");
      setMe(u); localStorage.setItem("splitwiseCurrentUser",JSON.stringify(u));
    }
  }
  function logout(){setMe(null);localStorage.removeItem("splitwiseCurrentUser");setPage("Dashboard");}
  function createGroup(e){
    e.preventDefault(); if(!groupName.trim()) return;
    setGroups(old=>[...old,{id:id(),name:groupName.trim(),members:[me.id,...groupMembers]}]);
    setGroupName("");setGroupMembers([]);notify("Group created.");
  }
  function addExpense(e){
    e.preventDefault();
    const g=groups.find(x=>x.id===expense.groupId);
    const amount=Number(expense.amount);
    if(!g || !expense.description.trim() || !Number.isFinite(amount) || amount<=0) return notify("Enter valid expense details.");
    const people=expense.participants.length?expense.participants:g.members;
    if(!people.length || !people.includes(expense.paidBy)) return notify("Choose who paid and who shares the expense.");
    setExpenses(old=>[{id:id(),groupId:g.id,description:expense.description.trim(),amount,paidBy:expense.paidBy,participants:people,date:new Date().toISOString()},...old]);
    setExpense({groupId:g.id,description:"",amount:"",paidBy:me.id,participants:[]});notify("Expense added and split equally.");
  }
  function addPayment(e){
    e.preventDefault();const amount=Number(payment.amount);
    if(!payment.from||!payment.to||payment.from===payment.to||!Number.isFinite(amount)||amount<=0)return notify("Enter valid settlement details.");
    setSettlements(old=>[{id:id(),...payment,amount,date:new Date().toISOString()},...old]);
    setPayment({from:me.id,to:"",amount:"",note:""});notify("Settlement recorded.");
  }
  if(!me) return <div className="auth"><div className="auth-intro"><div className="logo"><b>s</b> splitwise</div><div><small>LESS MATH. MORE LIFE.</small><h1>Good friends<br/>don't keep <i>score.</i></h1><p>Keep shared expenses simple, clear, and fair. Spend time together — we'll handle the numbers.</p></div><footer>Shared expenses, simplified.</footer></div><form className="auth-form" onSubmit={submitAuth}><small>{authMode==="login"?"WELCOME BACK":"GET STARTED"}</small><h2>{authMode==="login"?"Log in to SplitWise":"Create your account"}</h2>{authMode==="signup"&&<label>Full name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})}/></label>}<label>Email address<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label><label>Password<input type="password" required value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>{authMode==="signup"&&<label>Confirm password<input type="password" required value={auth.confirm} onChange={e=>setAuth({...auth,confirm:e.target.value})}/></label>}<button className="primary">{authMode==="login"?"Log in":"Create account"} →</button><p className="switch">{authMode==="login"?"New to SplitWise?":"Already registered?"} <button type="button" onClick={()=>setAuthMode(authMode==="login"?"signup":"login")}>{authMode==="login"?"Create an account":"Log in"}</button></p>{authMode==="login"&&<div className="demo"><b>Demo accounts</b><span>Admin: admin@splitwise.com / admin123</span><span>User: farhan@gmail.com / 1234</span><span>User: rahul@gmail.com / 1234</span></div>}</form>{message&&<div className="toast">{message}</div>}</div>;

  const memberUsers=users.filter(u=>u.role==="user");
  const groupForExpense=groups.find(g=>g.id===expense.groupId);
  const recent=visibleExpenses.slice(0,6);
  const total=visibleExpenses.reduce((s,e)=>s+e.amount,0);
  const paid=visibleExpenses.filter(e=>e.paidBy===me.id).reduce((s,e)=>s+e.amount,0);
  const title=page;
  return <div className="layout"><aside className="sidebar"><div className="logo"><b>s</b> splitwise</div><small>WORKSPACE</small>{["Dashboard","Groups","Expenses","Settlements",...(me.role==="admin"?["Admin"]:[])].map((p,i)=><button key={p} className={page===p?"nav active":"nav"} onClick={()=>setPage(p)}><span>{["⌂","◫","↗","⇄","⚙"][i]}</span>{p}</button>)}<div className="userbox"><b>{me.name[0].toUpperCase()}</b><div><strong>{me.name}</strong><small>{me.role}</small></div><button onClick={logout} title="Log out">↪</button></div></aside>
  <main><header><div><small>YOUR WORKSPACE</small><h2>{title}</h2></div><span>{me.name}　●</span></header>{message&&<div className="toast">{message}</div>}
  <div className="content">
  {page==="Dashboard"&&<><div className="welcome"><div><h1>Good to see you, {me.name.split(" ")[0]} ✦</h1><p>Here's what's happening with your shared expenses.</p></div><button className="primary" onClick={()=>setPage("Expenses")}>＋ Add an expense</button></div><div className="stats"><Stat label="YOUR GROUPS" value={visibleGroups.length} note="Groups you're part of"/><Stat label="TOTAL EXPENSES" value={cash(total)} note="Across your groups"/><Stat label="YOU PAID" value={cash(paid)} note="Paid by you"/><Stat label="PAYMENTS RECORDED" value={settlements.length} note="Settlements"/></div><div className="columns"><section className="panel"><h3>Your groups</h3><p>Groups you're sharing with.</p>{visibleGroups.length?visibleGroups.map(g=><div className="line" key={g.id}><b className="bubble">{g.name[0].toUpperCase()}</b><div><strong>{g.name}</strong><small>{g.members.length} members</small></div></div>):<Empty text="No groups yet. Create one to get started."/ >}</section><section className="panel"><h3>Recent expenses</h3><p>Your latest shared spending.</p>{recent.length?recent.map(e=><ExpenseLine key={e.id} item={e} users={users} groups={groups}/>):<Empty text="No expenses have been added yet."/ >}</section></div></>}
  {page==="Groups"&&<><div className="heading"><div><h1>Your groups</h1><p>Organise expenses by trip, home, or activity.</p></div></div><form className="panel form" onSubmit={createGroup}><h3>Create a group</h3><label>Group name<input required placeholder="e.g. Goa trip" value={groupName} onChange={e=>setGroupName(e.target.value)}/></label><label>Choose members</label><div className="checks">{memberUsers.filter(u=>u.id!==me.id).map(u=><label key={u.id}><input type="checkbox" checked={groupMembers.includes(u.id)} onChange={e=>setGroupMembers(old=>e.target.checked?[...old,u.id]:old.filter(x=>x!==u.id))}/>{u.name}</label>)}</div><button className="primary">Create group</button></form><div className="group-grid">{visibleGroups.map(g=><div className="panel group-card" key={g.id}><b className="bubble">{g.name[0]}</b><h3>{g.name}</h3><p>{g.members.length} members</p><div className="avatars">{g.members.map(mid=><span key={mid}>{users.find(u=>u.id===mid)?.name[0]||"?"}</span>)}</div></div>)}</div></>}
  {page==="Expenses"&&<><div className="heading"><div><h1>Expenses</h1><p>Add shared costs and see how they're split.</p></div></div><div className="columns"><form className="panel form" onSubmit={addExpense}><h3>Add a new expense</h3><label>Group<select required value={expense.groupId} onChange={e=>setExpense({...expense,groupId:e.target.value,paidBy:"",participants:[]})}><option value="">Select group</option>{visibleGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Description<input required placeholder="e.g. Dinner, groceries" value={expense.description} onChange={e=>setExpense({...expense,description:e.target.value})}/></label><label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})}/></label><label>Paid by<select required value={expense.paidBy} onChange={e=>setExpense({...expense,paidBy:e.target.value})}><option value="">Select payer</option>{users.filter(u=>groupForExpense?.members.includes(u.id)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Split between <small>Leave unchecked to include everyone.</small></label><div className="checks">{users.filter(u=>groupForExpense?.members.includes(u.id)).map(u=><label key={u.id}><input type="checkbox" checked={expense.participants.includes(u.id)} onChange={e=>setExpense({...expense,participants:e.target.checked?[...expense.participants,u.id]:expense.participants.filter(x=>x!==u.id)})}/>{u.name}</label>)}</div><button className="primary" disabled={!visibleGroups.length}>Save expense</button>{!visibleGroups.length&&<small>Create a group first.</small>}</form><section className="panel"><h3>Expense history</h3>{visibleExpenses.length?visibleExpenses.map(e=><ExpenseLine key={e.id} item={e} users={users} groups={groups}/>):<Empty text="Your expense history will appear here."/ >}</section></div></>}
  {page==="Settlements"&&<><div className="heading"><div><h1>Settlements</h1><p>Record payments between group members.</p></div></div><div className="columns"><form className="panel form" onSubmit={addPayment}><h3>Record a payment</h3><label>Paid by<select required value={payment.from} onChange={e=>setPayment({...payment,from:e.target.value,to:""})}><option value="">Select member</option>{memberUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Paid to<select required value={payment.to} onChange={e=>setPayment({...payment,to:e.target.value})}><option value="">Select member</option>{memberUsers.filter(u=>u.id!==payment.from).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></label><label>Note (optional)<input value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})} placeholder="e.g. Dinner payment"/></label><button className="primary">Record settlement</button></form><section className="panel"><h3>Payment history</h3>{settlements.length?settlements.map(s=><div className="line" key={s.id}><b className="bubble">⇄</b><div><strong>{users.find(u=>u.id===s.from)?.name} paid {users.find(u=>u.id===s.to)?.name}</strong><small>{s.note||"Settlement"} · {new Date(s.date).toLocaleDateString()}</small></div><strong>{cash(s.amount)}</strong></div>):<Empty text="No settlements recorded yet."/ >}</section></div></>}
  {page==="Admin"&&me.role==="admin"&&<><div className="heading"><div><h1>Admin overview</h1><p>Monitor users and platform activity.</p></div></div><div className="stats"><Stat label="REGISTERED USERS" value={memberUsers.length} note="User accounts"/><Stat label="TOTAL GROUPS" value={groups.length} note="Created groups"/><Stat label="TOTAL EXPENSES" value={cash(expenses.reduce((s,e)=>s+e.amount,0))} note={`${expenses.length} transactions`}/><Stat label="SETTLEMENTS" value={settlements.length} note="Recorded payments"/></div><section className="panel"><h3>Registered users</h3>{users.map(u=><div className="line" key={u.id}><b className="bubble">{u.name[0]}</b><div><strong>{u.name}</strong><small>{u.email}</small></div><span className="role">{u.role}</span></div>)}</section></>}
  </div></main></div>;
}

function Stat({label,value,note}){return <div className="stat"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>}
function Empty({text}){return <div className="empty">{text}</div>}
function ExpenseLine({item,users,groups}){return <div className="line"><b className="bubble">₹</b><div><strong>{item.description}</strong><small>{groups.find(g=>g.id===item.groupId)?.name||"Group"} · Paid by {users.find(u=>u.id===item.paidBy)?.name||"Member"}</small></div><strong>{cash(item.amount)}</strong></div>}
export default App;