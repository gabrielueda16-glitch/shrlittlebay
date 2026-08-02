const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbxW82kuzReAWEddTJexpWhQ2Q2__jbz5Zcu-agaHHFMQcHxQT6rz2l-KbRxNHWxkCVl/exec",
  buildings: ["A","B","C","D","E","F","G"],
  unitsByBuilding: {
    A: ["A001","A002","A003","A004","A101","A102","A103","A104","A105","A201","A202","A203","A204","A205","A301","A302","A303","A304","A305"],
    B: ["B001","B002","B003","B004","B101","B102","B103","B104","B105","B201","B202","B203","B204","B205","B301","B302","B303","B304","B305"],
    C: ["C001","C002","C003","C004","C101","C102","C103","C104","C105","C201","C202","C203","C204","C205","C301","C302","C303","C304","C305"],
    D: ["D001","D002","D003","D004","D101","D102","D103","D104","D105","D201","D202","D203","D204","D205","D301","D302","D303","D304","D305"],
    E: ["E001","E002","E003","E004","E101","E102","E103","E201","E202","E203","E301","E302","E303"],
    F: ["F001","F002","F003","F004","F101","F102","F103","F104","F105","F201","F202","F203","F204","F205","F301","F302","F303","F304","F305"],
    G: ["G001","G002","G003","G004","G101","G102","G103","G104","G105","G201","G202","G203","G204","G205","G301","G302","G303","G304","G305"]
  },
  installers: ["Gabriel Ueda","Lucas Hoffman","Lucas Domingues","Gabriel Chaklian","Arian","Pedro","Wesley","Caio Lucca","Fabio Rosa","Bass","Cristian Correa","Vinicius Telles","Samir","Kepner","Javier Salinas","Billy Panda","New Installer 1","New Installer 2","New Installer 3"],
  completionItems: ["SHELF DONE","GAP FILLER DONE","SCREW CAP DONE","DOOR DONE","END PANEL DONE","PIN SHELF DONE","HANDLES DONE","KICK FACE DONE","CAULKING DONE","CLEANING DONE"],
  missingItems: ["DOOR","SHELF","GAP FILLER","END PANEL","PIN SHELF","KICKER","HANDLE","OTHER"]
};

let selectedBuilding = "";
let selectedUnit = "";

const $ = id => document.getElementById(id);

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

function createTiles(){
  const grid = $("buildingGrid");
  grid.innerHTML = "";
  CONFIG.buildings.forEach(b => {
    const div = document.createElement("div");
    div.className = "tile";
    div.innerHTML = `<div>BUILDING ${b}<small>${CONFIG.unitsByBuilding[b].length} apartments</small></div>`;
    div.addEventListener("click", () => openBuilding(b));
    grid.appendChild(div);
  });
}

function openBuilding(building){
  selectedBuilding = building;
  $("unitsBreadcrumb").textContent = `Home › Building ${building}`;
  const grid = $("unitGrid");
  grid.innerHTML = "";
  CONFIG.unitsByBuilding[building].forEach(unit => {
    const div = document.createElement("div");
    div.className = "tile";
    div.textContent = unit;
    div.addEventListener("click", () => openForm(unit));
    grid.appendChild(div);
  });
  showScreen("unitsScreen");
}

function openForm(unit){
  selectedUnit = unit;
  $("formBreadcrumb").textContent = `Home › Building ${selectedBuilding} › ${unit}`;
  $("room").value = "";
  $("cabinets").value = 0;
  $("assembly").value = 0;
  $("fillers").value = 0;
  $("cutModify").value = 0;
  $("comments").value = "";
  document.querySelectorAll("#completionChecks input,#missingChecks input").forEach(i=>i.checked=false);
  $("saveStatus").className = "status";
  $("saveStatus").textContent = "";
  showScreen("formScreen");
}

function makeChecks(containerId, items, prefix){
  const c = $(containerId);
  c.innerHTML = "";
  items.forEach((item,index)=>{
    const wrap = document.createElement("label");
    wrap.className = "check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `${prefix}_${index}`;
    input.value = item;
    const span = document.createElement("span");
    span.textContent = item;
    wrap.append(input,span);
    c.appendChild(wrap);
  });
}

function saveRecords(records){
  localStorage.setItem("shr_installation_records", JSON.stringify(records));
}
function getRecords(){
  try{return JSON.parse(localStorage.getItem("shr_installation_records") || "[]")}
  catch{return []}
}
function selectedValues(selector){
  return [...document.querySelectorAll(selector)].filter(x=>x.checked).map(x=>x.value);
}

async function saveRecord(){
  const installer = $("installer").value;
  const room = $("room").value;
  const cabinets = Number($("cabinets").value || 0);
  const assembly = Number($("assembly").value || 0);
  const fillers = Number($("fillers").value || 0);
  const cutModify = Number($("cutModify").value || 0);
  const workDate = $("workDate").value;
  const status = $("saveStatus");
  const saveBtn = $("saveRecordBtn");

  if(!installer || !room || !workDate){
    status.className = "status err";
    status.textContent = "Please select installer, room and date.";
    return;
  }

  if(!navigator.onLine){
    status.className = "status err";
    status.textContent = "No internet connection. Please connect and try again.";
    return;
  }

  const record = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    date: workDate,
    installer,
    building: selectedBuilding,
    unit: selectedUnit,
    room,
    cabinets,
    assembly,
    fillers,
    cutModify,
    completed: selectedValues("#completionChecks input"),
    missing: selectedValues("#missingChecks input"),
    comments: $("comments").value.trim()
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  status.className = "status";
  status.textContent = "";

  try {
    /*
      Google Apps Script is on another domain. no-cors allows the browser
      to submit the record without blocking it. The same record is also
      kept in this browser so Weekly Report and CSV continue to work.
    */
    await fetch(CONFIG.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(record)
    });

    const records = getRecords();
    records.push(record);
    saveRecords(records);

    status.className = "status ok";
    status.textContent = "✓ Installation saved successfully in Google Sheets.";
    setTimeout(()=>openBuilding(selectedBuilding),1100);
  } catch(error) {
    status.className = "status err";
    status.textContent = "Error saving installation. Check the internet and try again.";
    console.error(error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Installation";
  }
}

function csvEscape(value){
  const s = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${s.replaceAll('"','""')}"`;
}

function exportCSV(){
  const records = getRecords();
  if(!records.length){ alert("No records saved yet."); return; }

  const headers = ["Date","Installer","Building","Unit","Room","Cabinets Installed","Cabinet Assembly","Fillers","Cut & Modify","Completed","Missing Material","Comments","Timestamp"];
  const rows = records.map(r => [
    r.date,r.installer,r.building,r.unit,r.room,r.cabinets || 0,r.assembly || 0,r.fillers || 0,r.cutModify || 0,r.completed,r.missing,r.comments,r.timestamp
  ]);
  const csv = [headers,...rows].map(row=>row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "SHR_Little_Bay_Installations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function weekEnd(start){
  const d = new Date(start+"T00:00:00");
  d.setDate(d.getDate()+6);
  return d;
}
function isoDate(d){return d.toISOString().slice(0,10)}

function generateReport(){
  const start = $("weekStart").value;
  if(!start){ alert("Select the first day of the week."); return; }
  const end = isoDate(weekEnd(start));
  const records = getRecords().filter(r=>r.date>=start && r.date<=end);
  const content = $("reportContent");

  if(!records.length){
    content.innerHTML = `<div class="panel">No records found from ${start} to ${end}.</div>`;
    return;
  }

  const byInstaller = {};
  records.forEach(r => {
    if(!byInstaller[r.installer]) byInstaller[r.installer] = [];
    byInstaller[r.installer].push(r);
  });

  let totalCabinets = records.reduce((s,r)=>s+Number(r.cabinets || 0),0);
  let totalAssembly = records.reduce((s,r)=>s+Number(r.assembly || 0),0);
  let totalFillers = records.reduce((s,r)=>s+Number(r.fillers || 0),0);
  let totalCutModify = records.reduce((s,r)=>s+Number(r.cutModify || 0),0);
  let html = `
    <div class="summary">
      <div class="metric">Total records<strong>${records.length}</strong></div>
      <div class="metric">Cabinets installed<strong>${totalCabinets}</strong></div>
      <div class="metric">Cabinet assembly<strong>${totalAssembly}</strong></div>
      <div class="metric">Fillers<strong>${totalFillers}</strong></div>
      <div class="metric">Cut & Modify<strong>${totalCutModify}</strong></div>
      <div class="metric">Installers<strong>${Object.keys(byInstaller).length}</strong></div>
      <div class="metric">Week ending<strong style="font-size:18px">${end}</strong></div>
    </div>`;

  Object.entries(byInstaller).forEach(([installer,items])=>{
    const cabinets = items.reduce((s,r)=>s+Number(r.cabinets || 0),0);
    const assembly = items.reduce((s,r)=>s+Number(r.assembly || 0),0);
    const fillers = items.reduce((s,r)=>s+Number(r.fillers || 0),0);
    const cutModify = items.reduce((s,r)=>s+Number(r.cutModify || 0),0);
    const units = [...new Set(items.map(r=>r.unit))];
    html += `
      <div class="panel" style="margin-bottom:16px">
        <h3 style="margin-top:0">${installer}</h3>
        <p>
          <strong>Cabinets installed:</strong> ${cabinets} &nbsp; | &nbsp;
          <strong>Assembly:</strong> ${assembly} &nbsp; | &nbsp;
          <strong>Fillers:</strong> ${fillers} &nbsp; | &nbsp;
          <strong>Cut & Modify:</strong> ${cutModify} &nbsp; | &nbsp;
          <strong>Units worked:</strong> ${units.length}
        </p>
        <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Date</th><th>Unit</th><th>Room</th><th>Installed</th><th>Assembly</th><th>Fillers</th><th>Cut & Modify</th><th>Completed</th><th>Missing</th><th>Comments</th>
          </tr></thead>
          <tbody>
            ${items.map(r=>`
              <tr>
                <td>${r.date}</td>
                <td>${r.unit}</td>
                <td>${r.room}</td>
                <td>${r.cabinets || 0}</td>
                <td>${r.assembly || 0}</td>
                <td>${r.fillers || 0}</td>
                <td>${r.cutModify || 0}</td>
                <td>${r.completed.join(", ") || "-"}</td>
                <td>${r.missing.join(", ") || "-"}</td>
                <td>${r.comments || "-"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        </div>
      </div>`;
  });

  content.innerHTML = html;
}


function generateDashboard(){
  const start = $("dashboardStart").value;
  const end = $("dashboardEnd").value;
  const records = getRecords().filter(r => (!start || r.date >= start) && (!end || r.date <= end));
  const content = $("dashboardContent");

  const totals = {
    cabinets: records.reduce((s,r)=>s+Number(r.cabinets || 0),0),
    assembly: records.reduce((s,r)=>s+Number(r.assembly || 0),0),
    fillers: records.reduce((s,r)=>s+Number(r.fillers || 0),0),
    cutModify: records.reduce((s,r)=>s+Number(r.cutModify || 0),0)
  };

  const byBuilding = {};
  records.forEach(r=>{
    if(!byBuilding[r.building]){
      byBuilding[r.building] = {records:0,cabinets:0,assembly:0,fillers:0,cutModify:0};
    }
    byBuilding[r.building].records += 1;
    byBuilding[r.building].cabinets += Number(r.cabinets || 0);
    byBuilding[r.building].assembly += Number(r.assembly || 0);
    byBuilding[r.building].fillers += Number(r.fillers || 0);
    byBuilding[r.building].cutModify += Number(r.cutModify || 0);
  });

  let html = `
    <div class="summary">
      <div class="metric">Cabinets Installed<strong>${totals.cabinets}</strong></div>
      <div class="metric">Cabinet Assembly<strong>${totals.assembly}</strong></div>
      <div class="metric">Fillers<strong>${totals.fillers}</strong></div>
      <div class="metric">Cut & Modify<strong>${totals.cutModify}</strong></div>
    </div>`;

  if(!records.length){
    content.innerHTML = html + `<div class="panel">No production records found for this period.</div>`;
    return;
  }

  html += `
    <div class="panel">
      <h3 style="margin-top:0">Production by Building</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Building</th>
              <th>Records</th>
              <th>Installed</th>
              <th>Assembly</th>
              <th>Fillers</th>
              <th>Cut & Modify</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(byBuilding).sort().map(building=>`
              <tr>
                <td>Building ${building}</td>
                <td>${byBuilding[building].records}</td>
                <td>${byBuilding[building].cabinets}</td>
                <td>${byBuilding[building].assembly}</td>
                <td>${byBuilding[building].fillers}</td>
                <td>${byBuilding[building].cutModify}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;

  content.innerHTML = html;
}


function init(){
  createTiles();
  makeChecks("completionChecks",CONFIG.completionItems,"done");
  makeChecks("missingChecks",CONFIG.missingItems,"missing");

  $("installer").innerHTML = `<option value="">Select installer</option>` +
    CONFIG.installers.map(x=>`<option>${x}</option>`).join("");

  const today = new Date();
  $("workDate").value = isoDate(today);
  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  $("weekStart").value = isoDate(monday);
  $("dashboardStart").value = isoDate(monday);
  $("dashboardEnd").value = isoDate(today);

  $("homeBtn").addEventListener("click",()=>showScreen("buildingsScreen"));
  $("dashboardBtn").addEventListener("click",()=>{ showScreen("dashboardScreen"); generateDashboard(); });
  $("reportBtn").addEventListener("click",()=>showScreen("reportScreen"));
  $("exportBtn").addEventListener("click",exportCSV);
  $("saveRecordBtn").addEventListener("click",saveRecord);
  $("generateReportBtn").addEventListener("click",generateReport);
  $("refreshDashboardBtn").addEventListener("click",generateDashboard);
}
init();
