import { ROOMS, EXHIBITS } from './content.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripHtml = (s) => { const d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const roomName = (id) => { const r = ROOMS.find((x) => x.id === id); return r ? `${r.num} · ${r.title}` : id; };

export class UI {
  constructor(data, hooks) {
    this.data = data; this.hooks = hooks;
    this.claims = Object.fromEntries(data.provenance.claims.map((c) => [c.id, c]));
    this.open = null;
    $('#panel-close').addEventListener('click', () => this.closeAll());
    $('#archive-close').addEventListener('click', () => this.closeAll());
    $('#map-close').addEventListener('click', () => this.closeAll());
    $('#text-close').addEventListener('click', () => this.closeAll());
    $('#archive-search').addEventListener('input', () => this.renderClaims());
    $('#archive-filters').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-f]'); if (!b) return;
      this.filter = b.dataset.f; this.renderClaims();
      for (const x of document.querySelectorAll('#archive-filters button')) x.classList.toggle('on', x === b);
    });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-claim]'); if (a) { e.preventDefault(); this.openArchive(null, a.dataset.claim); }
      const t = e.target.closest('[data-travel]'); if (t) { e.preventDefault(); this.closeAll(); this.hooks.travelToRoom(t.dataset.travel); }
    });
    this.filter = 'all';
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.open) this.closeAll(); });
    this.buildArchiveStatic();
  }

  isOpen() { return !!this.open; }

  closeAll() {
    for (const id of ['#panel', '#archive', '#map', '#textmode']) $(id).classList.remove('show');
    const was = this.open; this.open = null;
    if (was) this.hooks.onClose?.();
  }

  show(id) { this.closeAll(); $(id).classList.add('show'); this.open = id; this.hooks.onOpen?.(); }

  claimHTML(c) {
    if (!c) return '';
    const mcp = c.mcpServer
      ? `<span class="chip mcp">MCP · ${esc(c.mcpServer)} · ${esc(c.mcpTool)}</span>`
      : `<span class="chip">${esc(c.mcpTool)}</span>`;
    return `<article class="claim conf-${esc(c.confidence)}">
      <p class="claim-text">${esc(c.claim)}</p>
      <div class="chips">${mcp}<span class="chip conf">${esc(c.confidence)} confidence</span><span class="chip">${esc(c.temporal)}</span><span class="chip">accessed ${esc(c.accessed)}</span></div>
      <p class="src"><strong>${esc(c.organization)}</strong> · <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a></p>
      ${c.qualification ? `<p class="qual">${esc(c.qualification)}</p>` : ''}
      <p class="cid"><a href="#" data-claim="${esc(c.id)}">${esc(c.id)} · view in archive</a></p>
    </article>`;
  }

  openExhibit(id) {
    const ex = EXHIBITS[id]; if (!ex) return;
    if (ex.action === 'archive') return this.openArchive();
    if (ex.action === 'method') return this.openArchive('method');
    if (ex.action === 'mcp') return this.openArchive('mcp');
    if (ex.action === 'gaps') return this.openArchive('gaps');
    if (ex.action === 'exit') return this.hooks.exitToEntrance();
    const body = [];
    body.push(`<p class="kicker">${esc(roomName(ex.room))} — ${esc(ex.kicker)}</p><h2>${esc(ex.title)}</h2>`);
    if (ex.text.length) body.push(`<div class="curatorial"><p class="label">Curatorial text · interpretation, not a cited claim</p>${ex.text.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`);
    if (ex.claims.length) body.push(`<p class="label">Evidence · ${ex.claims.length} claim${ex.claims.length > 1 ? 's' : ''}</p>` + ex.claims.map((c) => this.claimHTML(this.claims[c])).join(''));
    else body.push('<p class="label">No factual claims are made on this object.</p>');
    $('#panel-body').innerHTML = body.join(''); $('#panel-body').scrollTop = 0;
    this.show('#panel');
  }

  openDataset(i) {
    const d = this.data.datasets[i];
    $('#panel-body').innerHTML = `
      <p class="kicker">04 · The Neighborhood — Data.gov dataset ${i + 1} of ${this.data.datasets.length}</p>
      <h2>${esc(d.title)}</h2>
      <dl class="meta">
        <dt>Publisher</dt><dd>${esc(d.publisher)}</dd>
        <dt>Issued</dt><dd>${esc((d.issued || '').slice(0, 10))}</dd>
        <dt>Last modified</dt><dd>${esc((d.modified || '').slice(0, 10))}</dd>
        <dt>Formats</dt><dd>${esc((d.formats || []).filter(Boolean).join(', '))}</dd>
        <dt>Spatial</dt><dd>${esc(d.spatial || '—')}</dd>
      </dl>
      <p class="desc">${esc(stripHtml(d.description).slice(0, 700))}${stripHtml(d.description).length > 700 ? '…' : ''}</p>
      <p class="src"><a href="${esc(d.catalogUrl)}" target="_blank" rel="noopener">Data.gov catalog record</a>${d.landingPage ? ` · <a href="${esc(d.landingPage)}" target="_blank" rel="noopener">Publisher landing page</a>` : ''}</p>
      <p class="label">Provenance</p>${this.claimHTML(this.claims['dg-01'])}${this.claimHTML(this.claims['dg-00'])}`;
    this.show('#panel');
  }

  // ---------------- Archive ----------------
  buildArchiveStatic() {
    const P = this.data.provenance, N = this.data.nps;
    $('#archive-method').innerHTML = `
      <h3>Methodology</h3>
      <p>Research ran on ${esc(P.compiled)}. Two Model Context Protocol (MCP) servers were called from the development environment: <strong>nationalparks</strong> (National Park Service Data API) and <strong>datagov</strong> (Data.gov catalogue). Historical claims the MCP tools could not supply were checked against published web pages, mostly NPS pages. Each claim records whether it came from an MCP tool or from web research.</p>
      <p>The NPS API key was used only inside the local MCP server configuration. It does not appear anywhere in this site. The site never calls the NPS API or Data.gov; it reads dated snapshots stored in <code>research/</code>.</p>
      <p>Confidence is marked <em>high</em> when the claim is quoted from a primary or official source that was read directly, <em>medium</em> for journalism or tertiary sources, and <em>low</em> when a claim was seen only through a search summary or rests on oral tradition. Where sources disagree, both are shown. Curatorial text is labelled separately from claims.</p>
      <p>Drawings and models in the building are schematic and made for this exhibition. No archival photographs are reproduced.</p>`;
    $('#archive-mcp').innerHTML = `
      <h3>MCP provenance</h3>
      <p class="label">nationalparks · ${N.calls.length} calls · ${esc(N.accessed)}</p>
      ${N.calls.map((c) => `<div class="mcpcall"><code>${esc(c.tool)}(${esc(JSON.stringify(c.args))})</code><p>${esc(typeof c.result === 'string' ? c.result : c.result.title || c.result.name || (Array.isArray(c.result) ? c.result.map((a) => a.title).join(' · ') : ''))}</p>${c.interpretation ? `<p class="qual">${esc(c.interpretation)}</p>` : ''}</div>`).join('')}
      <p class="label">datagov · MCP failed</p>
      ${this.claimHTML(this.claims['dg-00'])}
      <p class="label">Datasets located (direct catalog request)</p>
      <ol class="dslist">${this.data.datasets.map((d) => `<li><a href="${esc(d.catalogUrl)}" target="_blank" rel="noopener">${esc(d.title)}</a> — ${esc(d.publisher)}, modified ${esc((d.modified || '').slice(0, 10))}</li>`).join('')}</ol>`;
    $('#archive-gaps').innerHTML = `<h3>Gaps</h3><ul>${P.gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
      <h3>Further reading</h3><ul>${P.furtherReading.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.title)}</a> <span class="qual">${esc(f.note)}</span></li>`).join('')}</ul>`;
    const rooms = [...new Set(P.claims.map((c) => c.room))];
    $('#archive-filters').innerHTML = `<button data-f="all" class="on">All</button><button data-f="mcp">MCP-sourced</button><button data-f="low">Low confidence</button>` +
      rooms.map((r) => `<button data-f="room:${r}">${esc(roomName(r))}</button>`).join('');
  }

  renderClaims() {
    const q = ($('#archive-search').value || '').toLowerCase();
    const list = this.data.provenance.claims.filter((c) => {
      if (this.filter === 'mcp' && !c.mcpServer) return false;
      if (this.filter === 'low' && c.confidence !== 'low') return false;
      if (this.filter.startsWith('room:') && c.room !== this.filter.slice(5)) return false;
      if (q && !JSON.stringify(c).toLowerCase().includes(q)) return false;
      return true;
    });
    $('#archive-claims').innerHTML = `<p class="label">${list.length} claim${list.length === 1 ? '' : 's'}</p>` + list.map((c) => `<div id="claim-${esc(c.id)}">${this.claimHTML(c)}</div>`).join('');
  }

  openArchive(section = null, claimId = null) {
    this.renderClaims(); this.show('#archive');
    const body = $('#archive .scroll');
    requestAnimationFrame(() => {
      let el = null;
      if (section) el = $(`#archive-${section}`);
      if (claimId) { this.filter = 'all'; $('#archive-search').value = ''; this.renderClaims(); el = document.getElementById(`claim-${claimId}`); el?.classList.add('flash'); }
      body.scrollTop = el ? el.offsetTop - 20 : 0;
    });
  }

  // ---------------- Plan ----------------
  openMap(pos, visited) {
    const minX = -32, maxX = 58, minZ = -68, maxZ = 108, s = 4;
    const W = (maxX - minX) * s, H = (maxZ - minZ) * s;
    const X = (x) => (x - minX) * s, Z = (z) => (z - minZ) * s;
    const shapes = ROOMS.map((r) => {
      const sh = r.shape, cls = visited.has(r.id) ? 'v' : '';
      const g = sh.type === 'rect'
        ? `<rect x="${X(sh.x0)}" y="${Z(sh.z0)}" width="${(sh.x1 - sh.x0) * s}" height="${(sh.z1 - sh.z0) * s}"/>`
        : `<circle cx="${X(sh.cx)}" cy="${Z(sh.cz)}" r="${sh.r * s}"/>`;
      const cx = sh.type === 'rect' ? X((sh.x0 + sh.x1) / 2) : X(sh.cx), cy = sh.type === 'rect' ? Z((sh.z0 + sh.z1) / 2) : Z(sh.cz);
      return `<g class="room ${cls}" data-travel="${r.id}">${g}<text x="${cx}" y="${cy}" text-anchor="middle">${r.num}</text></g>`;
    }).join('');
    const dot = `<circle class="you" cx="${X(pos.x)}" cy="${Z(pos.z)}" r="7"/>`;
    $('#map-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${shapes}${dot}</svg>`;
    $('#map-list').innerHTML = ROOMS.map((r) => `<li><a href="#" data-travel="${r.id}"><span>${r.num}</span> ${esc(r.title)}${visited.has(r.id) ? ' <em>visited</em>' : ''}</a></li>`).join('');
    this.show('#map');
  }

  // ---------------- Text mode ----------------
  openText(reason = '') {
    const html = [];
    if (reason) html.push(`<p class="notice">${esc(reason)}</p>`);
    html.push('<p>The same exhibition, laid out as text for screen readers, small screens, and devices that cannot run the 3D building. Every claim carries its provenance.</p>');
    for (const r of ROOMS) {
      html.push(`<section><p class="kicker">${r.num}</p><h2>${esc(r.title)}</h2><p class="sub">${esc(r.sub)}</p>`);
      for (const [id, ex] of Object.entries(EXHIBITS)) {
        if (ex.room !== r.id || ex.action) continue;
        html.push(`<h3>${esc(ex.title)} <span class="k">${esc(ex.kicker)}</span></h3>`);
        if (ex.text.length) html.push(`<div class="curatorial"><p class="label">Curatorial text</p>${ex.text.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`);
        html.push(ex.claims.map((c) => this.claimHTML(this.claims[c])).join(''));
      }
      if (r.id === 'neighborhood') html.push(`<ol class="dslist">${this.data.datasets.map((d) => `<li><a href="${esc(d.catalogUrl)}" target="_blank" rel="noopener">${esc(d.title)}</a> — ${esc(d.publisher)}</li>`).join('')}</ol>`);
      if (r.id === 'archive') html.push($('#archive-method').innerHTML + $('#archive-gaps').innerHTML);
      html.push('</section>');
    }
    $('#text-body').innerHTML = html.join(''); $('#text-body').scrollTop = 0;
    this.show('#textmode');
  }
}
