// ============================================================
// NXT — Form Produção Diária — v1.0
// Envia o lote de motos montadas para o webhook do Make,
// que adiciona cada moto na aba 📥 Produção Diária do Excel.
// ============================================================

// >>> COLE AQUI O WEBHOOK DO MAKE (depois de criar o cenário) <<<
const WEBHOOK_URL = 'https://hook.us2.make.com/hdhz0bubeq9dd2qiieaek4y9qnfe2lfr';

const MODELOS = ['Juna','Kay','Pancho','Akasha','Luna','Hyphen','Vega','Gataka','Jaya','Smart-Juna','Shaka','Zilla','V0','Jay','Kimbo'];
const CORES = ['Branco','Preto','Prateado','Cinza','Amarelo','Azul Escuro','Azul Turquesa','Azul Tropical','Bege','Branco Pérola','Fendi','Grafite','Laranja','Roxa','Verde','Verde Militar','Vermelho'];
const GALPOES = ['Jaraguá - Fábrica','Sumaré - Galpão 1'];

let lote = []; // {modelo,cor,chassi,motor,estado,obs}

const $ = id => document.getElementById(id);

// ---- normalização e validação de chassi ----
function normChassi(s){
  return (s||'').toUpperCase().replace(/\s|_/g,'').replace(/O/g,'0').replace(/I/g,'1');
}
function chassiInfo(raw){
  const c = normChassi(raw);
  if(!c) return {c:'', ok:false, msg:''};
  if(c.length === 17) return {c, ok:true, msg:'✓ 17 dígitos — ok'};
  return {c, ok:false, msg:`⚠ ${c.length} dígitos (precisa de 17)`};
}

// ---- popular selects ----
function fill(sel, arr){ sel.innerHTML = arr.map(v=>`<option value="${v}">${v}</option>`).join(''); }

function init(){
  fill($('modelo'), MODELOS);
  fill($('cor'), CORES);
  fill($('galpao'), GALPOES);
  $('data').value = new Date().toISOString().slice(0,10);

  $('chassi').addEventListener('input', onChassi);
  $('motor').addEventListener('input', onMotor);
  $('btnAdd').addEventListener('click', addMoto);
  $('btnEnviar').addEventListener('click', enviar);
  render();
}

function onChassi(){
  const el = $('chassi');
  const info = chassiInfo(el.value);
  // mostra normalizado em maiúscula enquanto digita
  if(el.value !== info.c && info.c) { const p=el.selectionStart; el.value=info.c; el.setSelectionRange(p,p); }
  const hint = $('hintChassi');
  el.classList.toggle('input-ok', info.ok);
  el.classList.toggle('input-warn', !info.ok && info.c.length>0);
  hint.className = 'hint' + (info.ok?' ok':(info.c.length?' warn':''));
  hint.textContent = info.msg || 'Digite o chassi — confere automaticamente.';
}
function onMotor(){
  const el=$('motor'); el.value = el.value.toUpperCase().replace(/\s/g,'');
  const dup = lote.some(m=>m.motor===el.value && el.value);
  $('hintMotor').className='hint'+(dup?' warn':'');
  $('hintMotor').textContent = dup ? '⚠ esse motor já está no lote' : '';
}

function addMoto(){
  const chassi = chassiInfo($('chassi').value);
  const motor = $('motor').value.toUpperCase().replace(/\s/g,'');
  if(!chassi.c){ toast('Preencha o chassi.','err'); return; }
  if(!chassi.ok && !confirm(`O chassi tem ${chassi.c.length} dígitos (não 17). Adicionar mesmo assim?`)) return;
  if(!motor){ toast('Preencha o motor.','err'); return; }
  if(lote.some(m=>m.chassi===chassi.c)){ toast('Esse chassi já está no lote.','err'); return; }

  lote.push({
    modelo: $('modelo').value, cor: $('cor').value, chassi: chassi.c,
    motor, estado: $('estado').value, obs: $('obs').value.trim()
  });
  // limpa só chassi/motor/obs (mantém modelo/cor pra lançar em série)
  $('chassi').value=''; $('motor').value=''; $('obs').value='';
  onChassi(); $('hintMotor').textContent='';
  $('chassi').focus();
  toast('Moto adicionada ✓','ok');
  render();
}

function removeMoto(i){ lote.splice(i,1); render(); }

function render(){
  $('contador').textContent = lote.length;
  $('listaVazia').style.display = lote.length ? 'none':'block';
  // resumo por modelo
  const cont = {};
  lote.forEach(m=>cont[m.modelo]=(cont[m.modelo]||0)+1);
  $('resumoModelos').innerHTML = Object.entries(cont).map(([m,n])=>`<span>${m}: <b>${n}</b></span>`).join('');
  // lista
  $('lista').innerHTML = lote.map((m,i)=>`
    <div class="lista-item">
      <div class="li-info">
        <div class="li-modelo">${m.modelo} <span class="li-cor">· ${m.cor}</span>
          <span class="li-estado ${m.estado==='Cemitério'?'cem':'ok'}">${m.estado==='Cemitério'?'Defeito':'Pronta'}</span>
        </div>
        <div class="li-chassi">${m.chassi} · motor ${m.motor}</div>
      </div>
      <button class="li-del" onclick="removeMoto(${i})" title="Remover">&times;</button>
    </div>`).join('');
  $('btnEnviar').disabled = lote.length===0;
  $('btnEnviar').textContent = lote.length ? `Enviar lote (${lote.length} moto${lote.length>1?'s':''})` : 'Enviar lote';
}

async function enviar(){
  if(!lote.length) return;
  if(WEBHOOK_URL.startsWith('COLE_AQUI')){ toast('Configure o WEBHOOK_URL no script.js','err'); return; }
  const cont={}; lote.forEach(m=>cont[m.modelo]=(cont[m.modelo]||0)+1);
  const resumo = Object.entries(cont).map(([m,n])=>`${n} ${m}`).join(' · ');
  const payload = {
    origem:'form-producao',
    data: $('data').value,
    galpao: $('galpao').value,
    responsavel: $('responsavel').value.trim(),
    total: lote.length,
    resumo: resumo,
    enviadoEm: new Date().toISOString(),
    motos: lote
  };
  const btn = $('btnEnviar'); btn.disabled=true; btn.textContent='Enviando...';
  try{
    const res = await fetch(WEBHOOK_URL, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('HTTP '+res.status);
    toast(`✓ ${lote.length} moto(s) enviada(s)!`,'ok');
    lote = []; render();
  }catch(e){
    toast('Erro ao enviar: '+e.message+'. Tente de novo.','err');
    btn.disabled=false;
  }
  render();
}

let toastT;
function toast(msg, kind){
  const t=$('toast'); t.textContent=msg; t.className='toast show '+(kind||'');
  clearTimeout(toastT); toastT=setTimeout(()=>t.className='toast',2600);
}

window.removeMoto = removeMoto;
document.addEventListener('DOMContentLoaded', init);

// PWA
if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }
