const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const starterTasks = [
  {id: crypto.randomUUID(), title:"Polish portfolio homepage", description:"Improve the hero section and project cards.", priority:"high", due:"", completed:false, created:Date.now()-500000},
  {id: crypto.randomUUID(), title:"Review JavaScript fundamentals", description:"Practice DOM events and array methods.", priority:"medium", due:"", completed:false, created:Date.now()-400000},
  {id: crypto.randomUUID(), title:"Plan next week's goals", description:"Choose three meaningful outcomes.", priority:"low", due:"", completed:true, created:Date.now()-300000},
  {id: crypto.randomUUID(), title:"Update GitHub README", description:"Add screenshots, setup steps and feature notes.", priority:"medium", due:"", completed:false, created:Date.now()-200000}
];

let tasks = JSON.parse(localStorage.getItem("taskflow_tasks") || "null") || starterTasks;
let currentFilter = "all";
let editingId = null;

const save = () => localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));

function escapeHTML(value="") {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function formatDue(date) {
  if (!date) return "No due date";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
}
function taskMarkup(task) {
  return `<article class="task-item ${task.completed ? "done":""}" data-id="${task.id}">
    <button class="check" aria-label="${task.completed?'Mark incomplete':'Mark complete'}">${task.completed?'✓':''}</button>
    <div class="task-body">
      <span class="task-title">${escapeHTML(task.title)}</span>
      <div class="task-meta"><span class="priority ${task.priority}">${task.priority}</span><span>•</span><span>${formatDue(task.due)}</span></div>
    </div>
    <div class="task-actions"><button class="edit-action" title="Edit">✎</button><button class="delete-action" title="Delete">×</button></div>
  </article>`;
}
function filteredTasks() {
  const q = ($("#searchInput")?.value || "").toLowerCase().trim();
  return tasks.filter(t => {
    const matchesFilter = currentFilter==="all" || (currentFilter==="active"&&!t.completed) || (currentFilter==="completed"&&t.completed) || (currentFilter==="high"&&t.priority==="high");
    return matchesFilter && (!q || `${t.title} ${t.description}`.toLowerCase().includes(q));
  }).sort((a,b)=>Number(a.completed)-Number(b.completed) || b.created-a.created);
}
function updateStats() {
  const total=tasks.length, completed=tasks.filter(t=>t.completed).length, progress=total-completed, high=tasks.filter(t=>t.priority==="high"&&!t.completed).length;
  const rate=total?Math.round(completed/total*100):0;
  $("#completedStat").textContent=completed; $("#progressStat").textContent=progress; $("#priorityStat").textContent=high; $("#rateStat").textContent=rate+"%";
  $("#completedTrend").textContent=`${rate}% of all tasks`; $("#rateMessage").textContent=rate>=75?"Excellent momentum":rate>=40?"Keep it going":"Let's get started";
  $("#ringValue").textContent=rate+"%"; $("#legendDone").textContent=completed; $("#legendRemaining").textContent=progress;
  $("#progressRing").style.background=`conic-gradient(var(--primary) ${rate*3.6}deg, #e7e9f0 ${rate*3.6}deg)`;
}
function render() {
  updateStats();
  const recent=[...tasks].sort((a,b)=>b.created-a.created).slice(0,5);
  $("#recentTasks").innerHTML=recent.map(taskMarkup).join("");
  $("#recentEmpty").classList.toggle("hidden", recent.length>0);
  const list=filteredTasks();
  $("#allTasks").innerHTML=list.map(taskMarkup).join("");
  $("#allEmpty").classList.toggle("hidden", list.length>0);
  $("#taskCount").textContent=`${list.length} task${list.length===1?"":"s"}`;
  renderAnalytics();
}
function renderAnalytics() {
  const total=tasks.length||1;
  const groups=[["Completed",tasks.filter(t=>t.completed).length],["Active",tasks.filter(t=>!t.completed).length],["High priority",tasks.filter(t=>t.priority==="high").length],["Medium",tasks.filter(t=>t.priority==="medium").length],["Low",tasks.filter(t=>t.priority==="low").length]];
  $("#barChart").innerHTML=groups.map(([name,n])=>`<div class="bar" style="height:${Math.max(8,n/total*100)}%"><em>${n}</em><span>${name.split(" ")[0]}</span></div>`).join("");
  const p=["high","medium","low"];
  $("#priorityBreakdown").innerHTML=p.map(x=>{
    const n=tasks.filter(t=>t.priority===x).length, pct=Math.round(n/total*100);
    return `<div class="priority-row"><span>${x[0].toUpperCase()+x.slice(1)}</span><div class="priority-track"><div class="priority-fill" style="width:${pct}%"></div></div><b>${n}</b></div>`;
  }).join("");
  const completed=tasks.filter(t=>t.completed).length;
  $("#insightText").textContent = !tasks.length ? "Add a few tasks and TaskFlow will surface a useful insight here." :
    completed===tasks.length ? "Everything is complete. Your task list is fully cleared — great work." :
    completed===0 ? "You have a fresh board. Start with one high-impact task and build momentum." :
    `You've completed ${completed} of ${tasks.length} tasks. Focus on the remaining items one at a time.`;
}
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function openModal(task=null){
  editingId=task?.id||null; $("#modalTitle").textContent=task?"Edit task":"Create a new task"; $("#submitTask").textContent=task?"Save changes":"Create task";
  $("#taskId").value=task?.id||""; $("#taskTitle").value=task?.title||""; $("#taskDescription").value=task?.description||""; $("#taskPriority").value=task?.priority||"medium"; $("#taskDue").value=task?.due||"";
  $("#modal").classList.remove("hidden"); setTimeout(()=>$("#taskTitle").focus(),50);
}
function closeModal(){$("#modal").classList.add("hidden"); editingId=null}
function addOrEditTask(e){
  e.preventDefault();
  const data={title:$("#taskTitle").value.trim(),description:$("#taskDescription").value.trim(),priority:$("#taskPriority").value,due:$("#taskDue").value};
  if(!data.title)return;
  if(editingId){const t=tasks.find(x=>x.id===editingId);Object.assign(t,data);showToast("Task updated");}
  else{tasks.unshift({id:crypto.randomUUID(),...data,completed:false,created:Date.now()});showToast("Task created");}
  save();render();closeModal();
}
function toggleTask(id){const t=tasks.find(x=>x.id===id);if(t){t.completed=!t.completed;save();render();showToast(t.completed?"Task completed":"Task reopened")}}
function deleteTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;if(confirm(`Delete "${t.title}"?`)){tasks=tasks.filter(x=>x.id!==id);save();render();showToast("Task deleted")}}

function setView(view){
  $$(".view").forEach(v=>v.classList.remove("active")); $(`#${view}View`).classList.add("active");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("#pageTitle").textContent=view[0].toUpperCase()+view.slice(1);
  $("#sidebar").classList.remove("open");
}
function bindTaskEvents(container){
  container.addEventListener("click",e=>{
    const item=e.target.closest(".task-item"); if(!item)return; const id=item.dataset.id;
    if(e.target.closest(".check")) toggleTask(id);
    if(e.target.closest(".delete-action")) deleteTask(id);
    if(e.target.closest(".edit-action")) openModal(tasks.find(t=>t.id===id));
  });
}
bindTaskEvents($("#recentTasks")); bindTaskEvents($("#allTasks"));
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$$("[data-view-link]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.viewLink)));
$("#heroAddBtn").onclick=()=>openModal(); $("#tasksAddBtn").onclick=()=>openModal();
$("#closeModal").onclick=closeModal; $("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
$("#taskForm").addEventListener("submit",addOrEditTask);
$("#searchInput").addEventListener("input",render);
$$(".filter").forEach(b=>b.addEventListener("click",()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentFilter=b.dataset.filter;render()}));
$("#themeBtn").onclick=()=>{const dark=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=dark?"":"dark";localStorage.setItem("taskflow_theme",dark?"light":"dark")};
if(localStorage.getItem("taskflow_theme")==="dark")document.documentElement.dataset.theme="dark";
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#focusBtn").onclick=()=>showToast("Focus mode started — one task at a time.");
$("#profileBtn").onclick=()=>showToast("Welcome back, Alex.");
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
const hour=new Date().getHours(); $("#greeting").textContent=hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";
render();
