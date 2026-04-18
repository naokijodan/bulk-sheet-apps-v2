/* ============================================================
   一括シートV3 進捗ダッシュボード — app.js
   依存: window.PROGRESS_DATA (data.js)
   動作: file:// プロトコル対応、外部ライブラリ不使用
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     State
  ---------------------------------------------------------- */
  var state = {
    data: null,
    filtered: [],
    sortCol: 'cat_no',
    sortDir: 'asc',
    filterSearch: '',
    filterStatus: 'all',
    filterPriority: 'all',
    filterCpsc: 'all',
    expandedRows: {},
    sectionOpen: { completed: true, partial: true, not_started: true },
    lowGroupOpen: true
  };

  /* ----------------------------------------------------------
     Status Display Config
  ---------------------------------------------------------- */
  var STATUS_CONFIG = {
    completed:      { icon: '✅', label: '完了',    cls: 'completed' },
    partial:        { icon: '🟡', label: '部分',    cls: 'partial' },
    in_progress:    { icon: '🔵', label: '作業中',  cls: 'in_progress' },
    not_started:    { icon: '⏸', label: '未着手',  cls: 'not_started' },
    not_injected:   { icon: '⏸', label: '未注入',  cls: 'not_injected' },
    unknown:        { icon: '❓', label: '不明',    cls: 'unknown' },
    not_applicable: { icon: '➖', label: 'N/A',     cls: 'not_applicable' },
    shared:         { icon: '🔗', label: '共有',    cls: 'shared' },
    not_completed:  { icon: '⬜', label: '未完了',  cls: 'not_completed' }
  };

  var PRIORITY_LABEL = { high: 'High', mid: 'Mid', low: 'Low' };

  /* ----------------------------------------------------------
     Prompt color palette (hash-based, 10 colors)
  ---------------------------------------------------------- */
  var PROMPT_PALETTE = [
    '#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#e9d5ff',
    '#fed7aa', '#a5f3fc', '#fbcfe8', '#d9f99d', '#c7d2fe'
  ];

  function promptBasename(path) {
    if (!path) return null;
    var parts = path.replace(/\\/g, '/').split('/');
    var filename = parts[parts.length - 1];
    var dot = filename.lastIndexOf('.');
    return dot > 0 ? filename.slice(0, dot) : filename;
  }

  function promptColor(name) {
    if (!name) return null;
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return PROMPT_PALETTE[Math.abs(hash) % PROMPT_PALETTE.length];
  }

  var promptShareCount = {};

  function buildPromptShareCount(categories) {
    promptShareCount = {};
    categories.forEach(function (cat) {
      var name = promptBasename(cat.prompt_file);
      if (name) {
        promptShareCount[name] = (promptShareCount[name] || 0) + 1;
      }
    });
  }

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  function el(id) { return document.getElementById(id); }

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pct(n, total) {
    if (!total) return '0%';
    return Math.round(n / total * 100) + '%';
  }

  function statusCell(value) {
    if (value == null || value === '') { return statusCell('unknown'); }
    var cfg = STATUS_CONFIG[value];
    if (cfg) {
      return '<span class="status-cell status-cell--' + cfg.cls + '">' +
             cfg.icon + ' ' + cfg.label + '</span>';
    }
    return '<span class="status-cell status-cell--fixed">' + esc(value) + '</span>';
  }

  function templateCell(promptFile) {
    var name = promptBasename(promptFile);
    if (!name) {
      return '<td class="col-prompt"><span class="prompt-cell prompt-cell--empty">—</span></td>';
    }
    var color = promptColor(name);
    var count = promptShareCount[name] || 1;
    var countHtml = count >= 2
      ? '<span class="prompt-share-count">(' + count + ')</span>'
      : '';
    var style = color ? 'background:' + color + ';color:#1f2937;' : '';
    return '<td class="col-prompt"><span class="prompt-cell" style="' + style + '">' +
           esc(name) + '</span>' + countHtml + '</td>';
  }

  function compare(a, b, col, dir) {
    var va = a[col]; var vb = b[col];
    if (va == null) va = ''; if (vb == null) vb = '';
    var result = (typeof va === 'number' && typeof vb === 'number')
      ? va - vb
      : String(va).localeCompare(String(vb), 'ja');
    return dir === 'asc' ? result : -result;
  }

  /* ----------------------------------------------------------
     Header
  ---------------------------------------------------------- */
  function renderHeader(meta) {
    el('header-version').textContent = meta.version || '—';
    el('header-last-updated').textContent = meta.last_updated || '—';
    el('header-latest-commit').textContent = meta.latest_commit || '—';
    el('header-branch').textContent = meta.branch || '—';
  }

  /* ----------------------------------------------------------
     Stats Cards
  ---------------------------------------------------------- */
  function renderStats(stats, total, allIssues) {
    var tot = stats.total_categories || total || 0;
    var started = stats.phase_1b_started || 0;
    var completed = stats.phase_1b_fully_completed || 0;
    var issues = (allIssues || []).filter(function (i) { return i.status === 'open'; }).length;

    el('stat-total').textContent = tot;
    el('stat-started').textContent = started;
    el('stat-started-pct').textContent = pct(started, tot) + ' (' + started + '/' + tot + ')';
    el('stat-completed').textContent = completed;
    el('stat-completed-pct').textContent = pct(completed, tot) + ' (' + completed + '/' + tot + ')';
    el('stat-issues').textContent = issues;
  }

  /* ----------------------------------------------------------
     Phase Bars
  ---------------------------------------------------------- */
  function renderPhases(phases) {
    var html = '';
    phases.forEach(function (phase) {
      var pctVal = phase.progress_percent != null ? phase.progress_percent : 0;
      var fillCls = 'phase-item__fill';
      if (phase.status === 'completed') { fillCls += ' phase-item__fill--done'; }
      else if (phase.status === 'in_progress') { fillCls += ' phase-item__fill--active'; }
      else { fillCls += ' phase-item__fill--none'; }

      var statusCls = 'phase-status-badge phase-status-badge--' + (phase.status || 'not_started');
      var statusLabel = phase.status === 'completed' ? '完了'
                      : phase.status === 'in_progress' ? '進行中' : '未着手';
      var info = (phase.completed != null && phase.total != null)
        ? phase.completed + '/' + phase.total : '';

      html += '<div class="phase-item">' +
        '<div class="phase-item__label">' +
          esc(phase.name || phase.id) +
          '<span class="' + statusCls + '">' + statusLabel + '</span>' +
        '</div>' +
        '<div class="phase-item__track">' +
          '<div class="' + fillCls + '" style="width:' + Math.min(100, pctVal) + '%"></div>' +
        '</div>' +
        '<div class="phase-item__info">' +
          '<span class="phase-item__pct">' + pctVal + '%</span>' +
          (info ? ' &nbsp;(' + esc(info) + ')' : '') +
        '</div>' +
      '</div>';
    });
    el('phase-list').innerHTML = html || '<p class="empty-message">フェーズデータなし</p>';
  }

  /* ----------------------------------------------------------
     Filter & Sort
  ---------------------------------------------------------- */
  function applyFilters() {
    var search = state.filterSearch.toLowerCase();
    var statusF = state.filterStatus;
    var priorityF = state.filterPriority;
    var cpscF = state.filterCpsc;

    state.filtered = state.data.categories.filter(function (cat) {
      if (search) {
        var hay = ((cat.gas_name || '') + ' ' + (cat.ebay_category || '')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      if (statusF !== 'all') {
        if (statusF === 'completed' && cat.is_refinement !== 'completed') return false;
        if (statusF === 'partial' && cat.is_refinement !== 'partial') return false;
        if (statusF === 'not_started' && cat.is_refinement !== 'not_started') return false;
      }
      if (priorityF !== 'all' && cat.priority !== priorityF) return false;
      if (cpscF === 'cpsc' && !cat.cpsc_target) return false;
      return true;
    });

    var col = state.sortCol; var dir = state.sortDir;
    state.filtered.sort(function (a, b) { return compare(a, b, col, dir); });

    renderSections();
    renderFilterCount();
  }

  function renderFilterCount() {
    el('filter-count').textContent = state.filtered.length + ' 件表示中';
  }

  /* ----------------------------------------------------------
     Phase 1B Completion Check
  ---------------------------------------------------------- */
  function isPhase1bComplete(cat) {
    return cat.phase_1b_started === true &&
           cat.is_refinement === 'completed' &&
           (cat.prompt_absolute_rules === 'completed' || cat.prompt_absolute_rules === 'shared') &&
           cat.inject_country !== 'not_injected' &&
           cat.inject_features !== 'not_injected';
  }

  /* ----------------------------------------------------------
     3-Section Render
  ---------------------------------------------------------- */
  function renderSections() {
    var completed = []; var partial = []; var notStarted = [];

    state.filtered.forEach(function (cat) {
      if (!cat.phase_1b_started) { notStarted.push(cat); }
      else if (isPhase1bComplete(cat)) { completed.push(cat); }
      else { partial.push(cat); }
    });

    el('badge-completed').textContent = completed.length;
    el('badge-partial').textContent = partial.length;
    el('badge-not-started').textContent = notStarted.length;

    renderTbody(completed, 'tbody-completed');
    renderTbody(partial, 'tbody-partial');
    renderNotStartedTbody(notStarted, 'tbody-not-started');

    applySectionState();
    bindRowClicks();
    bindSubheaderClicks();
    updateSortIcons();
  }

  function applySectionState() {
    var sections = [
      { key: 'completed',   bodyId: 'body-completed',   sectionId: 'cat-section-completed' },
      { key: 'partial',     bodyId: 'body-partial',     sectionId: 'cat-section-partial' },
      { key: 'not_started', bodyId: 'body-not-started', sectionId: 'cat-section-not-started' }
    ];
    sections.forEach(function (s) {
      var body = el(s.bodyId); var sec = el(s.sectionId);
      if (!body || !sec) return;
      var isOpen = state.sectionOpen[s.key];
      body.style.display = isOpen ? '' : 'none';
      if (isOpen) { sec.classList.remove('cat-section--collapsed'); }
      else { sec.classList.add('cat-section--collapsed'); }
    });
  }

  /* ----------------------------------------------------------
     Build a single category row
  ---------------------------------------------------------- */
  function buildCatRow(cat) {
    var isExpanded = !!state.expandedRows[cat.cat_no];
    var rowCls = 'category-row' + (isExpanded ? ' row--expanded' : '');

    var fieldHtml = '<span class="field-count">' + (cat.field_count != null ? cat.field_count : '—');
    if (cat.field_count_original && cat.field_count_original !== cat.field_count) {
      fieldHtml += '<span class="field-count__orig">/' + cat.field_count_original + '</span>';
    }
    fieldHtml += '</span>';

    var nameHtml = '<span class="cat-name">' + esc(cat.gas_name) + '</span>';
    if (cat.cpsc_target) { nameHtml += '<span class="cat-cpsc">CPSC</span>'; }

    var priHtml = '';
    if (cat.priority) {
      priHtml = '<span class="priority-badge priority-badge--' + esc(cat.priority) + '">' +
                esc(PRIORITY_LABEL[cat.priority] || cat.priority) + '</span>';
    }

    var html = '<tr class="' + rowCls + '" data-catno="' + cat.cat_no + '">' +
      '<td class="col-no">' + cat.cat_no + '</td>' +
      '<td class="col-name">' + nameHtml + '</td>' +
      '<td class="col-ebay">' + esc(cat.ebay_category) + '</td>' +
      '<td class="col-fields">' + fieldHtml + '</td>' +
      '<td class="col-status">' + statusCell(cat.is_refinement) + '</td>' +
      '<td class="col-status">' + statusCell(cat.sanitize_integration) + '</td>' +
      '<td class="col-status">' + statusCell(cat.prompt_absolute_rules) + '</td>' +
      templateCell(cat.prompt_file) +
      '<td class="col-inject">' + statusCell(cat.inject_country) + '</td>' +
      '<td class="col-inject">' + statusCell(cat.inject_theme) + '</td>' +
      '<td class="col-inject">' + statusCell(cat.inject_age_level) + '</td>' +
      '<td class="col-inject">' + statusCell(cat.inject_features) + '</td>' +
      '<td class="col-priority">' + priHtml + '</td>' +
    '</tr>';

    if (isExpanded) {
      html += '<tr class="row-detail"><td colspan="13">' +
        '<div class="row-detail__grid">' +
          detailItem('最終コミット', cat.last_commit ? '<code>' + esc(cat.last_commit) + '</code>' : '—') +
          detailItem('プロンプトファイル', cat.prompt_file ? esc(cat.prompt_file) : '—') +
          detailItem('備考', esc(cat.notes) || '—') +
        '</div>' +
      '</td></tr>';
    }
    return html;
  }

  /* ----------------------------------------------------------
     Standard tbody render (completed / partial)
  ---------------------------------------------------------- */
  function renderTbody(cats, tbodyId) {
    var tbody = el(tbodyId);
    if (!tbody) return;
    if (!cats.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="empty-message">該当するカテゴリがありません</td></tr>';
      return;
    }
    var html = '';
    cats.forEach(function (cat) { html += buildCatRow(cat); });
    tbody.innerHTML = html;
  }

  /* ----------------------------------------------------------
     Not-started tbody render (priority subgroups)
  ---------------------------------------------------------- */
  var PRIO_ORDER = { high: 0, mid: 1, low: 2 };

  function renderNotStartedTbody(cats, tbodyId) {
    var tbody = el(tbodyId);
    if (!tbody) return;
    if (!cats.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="empty-message">該当するカテゴリがありません</td></tr>';
      return;
    }

    var sorted = cats.slice().sort(function (a, b) {
      var pa = PRIO_ORDER[a.priority] != null ? PRIO_ORDER[a.priority] : 99;
      var pb = PRIO_ORDER[b.priority] != null ? PRIO_ORDER[b.priority] : 99;
      return pa !== pb ? pa - pb : (a.cat_no || 0) - (b.cat_no || 0);
    });

    var groups = { high: [], mid: [], low: [] };
    sorted.forEach(function (cat) {
      var p = cat.priority;
      if (groups[p]) { groups[p].push(cat); } else { groups.low.push(cat); }
    });

    var subgroups = [
      { key: 'high', icon: '🔴', label: 'High', toggleable: false },
      { key: 'mid',  icon: '🟡', label: 'Mid',  toggleable: false },
      { key: 'low',  icon: '⚪', label: 'Low',  toggleable: true }
    ];

    var html = '';
    subgroups.forEach(function (sg) {
      var grpCats = groups[sg.key];
      if (!grpCats.length) return;

      var isOpen = sg.toggleable ? state.lowGroupOpen : true;
      var chevronCls = 'priority-subheader__chevron' + (!isOpen ? ' priority-subheader__chevron--collapsed' : '');
      var chevron = sg.toggleable ? ' <span class="' + chevronCls + '">▾</span>' : '';
      var rowCls = 'priority-subheader priority-subheader--' + sg.key +
                   (sg.toggleable ? ' priority-subheader--toggleable' : '');

      html += '<tr class="' + rowCls + '">' +
        '<td colspan="13">' +
          '<span class="priority-subheader__badge priority-subheader__badge--' + sg.key + '">' +
            sg.icon + ' ' + sg.label + '</span>' +
          ' <span class="priority-subheader__count">(' + grpCats.length + '件)</span>' +
          chevron +
        '</td></tr>';

      if (!isOpen) return;
      grpCats.forEach(function (cat) { html += buildCatRow(cat); });
    });

    tbody.innerHTML = html;
  }

  function detailItem(label, value) {
    return '<div class="row-detail__item">' +
      '<div class="row-detail__label">' + esc(label) + '</div>' +
      '<div class="row-detail__value">' + value + '</div>' +
    '</div>';
  }

  /* ----------------------------------------------------------
     Section Toggle
  ---------------------------------------------------------- */
  function initSectionToggles() {
    var headers = document.querySelectorAll('.cat-section__header');
    headers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-section');
        state.sectionOpen[key] = !state.sectionOpen[key];
        applySectionState();
      });
    });
  }

  function bindSubheaderClicks() {
    var rows = document.querySelectorAll('.priority-subheader--toggleable');
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        state.lowGroupOpen = !state.lowGroupOpen;
        renderNotStartedTbody(
          state.filtered.filter(function (cat) { return !cat.phase_1b_started; }),
          'tbody-not-started'
        );
        bindRowClicks();
        bindSubheaderClicks();
      });
    });
  }

  /* ----------------------------------------------------------
     Row Click (expand/collapse detail)
  ---------------------------------------------------------- */
  function bindRowClicks() {
    var rows = document.querySelectorAll('.category-row');
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var catno = Number(row.getAttribute('data-catno'));
        state.expandedRows[catno] = !state.expandedRows[catno];
        renderSections();
      });
    });
  }

  /* ----------------------------------------------------------
     Sort
  ---------------------------------------------------------- */
  function initSortHeaders() {
    var headers = document.querySelectorAll('.category-table th.sortable');
    headers.forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.getAttribute('data-col');
        if (state.sortCol === col) { state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { state.sortCol = col; state.sortDir = 'asc'; }
        applyFilters();
      });
    });
  }

  function updateSortIcons() {
    var headers = document.querySelectorAll('.category-table th.sortable');
    headers.forEach(function (th) {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.getAttribute('data-col') === state.sortCol) {
        th.classList.add('sort-' + state.sortDir);
      }
    });
  }

  /* ----------------------------------------------------------
     Unresolved Issues
  ---------------------------------------------------------- */
  var PRIORITY_ORDER = { highest: 0, high: 1, mid: 2, low: 3 };

  function buildIssueCard(issue) {
    var pri = issue.priority || 'low';
    var cats = issue.related_categories || [];
    var catsHtml = cats.length
      ? '<div class="issue-card__cats">' +
        cats.map(function (c) { return '<span class="cat-tag">' + esc(c) + '</span>'; }).join('') +
        '</div>' : '';
    var statusLabel = issue.status === 'resolved' ? '解決済み'
      : issue.status === 'archived' ? 'アーカイブ'
      : '未解決';
    var resolutionHtml = issue.resolution
      ? '<div class="issue-card__resolution"><span class="issue-card__meta-label">解決内容:</span> ' + esc(issue.resolution) + '</div>'
      : '';

    return '<div class="issue-card issue-card--' + esc(pri) + '">' +
      '<div class="issue-card__header">' +
        '<span class="issue-badge issue-badge--' + esc(pri) + '">' + esc(pri.toUpperCase()) + '</span>' +
        (issue.display_no ? '<span class="issue-card__no">#' + issue.display_no + '</span>' : '') +
        '<span class="issue-card__id">' + esc(issue.id) + '</span>' +
        '<span class="issue-card__title">' + esc(issue.title) + '</span>' +
        '<span class="issue-card__status">' + esc(statusLabel) + '</span>' +
      '</div>' +
      '<div class="issue-card__description">' + esc(issue.description) + '</div>' +
      resolutionHtml +
      (cats.length ? '<div class="issue-card__meta"><span class="issue-card__meta-label">関連カテゴリ:</span>' + catsHtml + '</div>' : '') +
    '</div>';
  }

  function renderIssues(issues) {
    var openIssues = issues.filter(function (i) { return i.status === 'open' || !i.status; });
    var resolvedIssues = issues.filter(function (i) { return i.status === 'resolved' || i.status === 'archived'; });

    el('issues-count-badge').textContent = openIssues.length;

    function sortByPriority(arr) {
      return arr.slice().sort(function (a, b) {
        var pa = PRIORITY_ORDER[a.priority] != null ? PRIORITY_ORDER[a.priority] : 99;
        var pb = PRIORITY_ORDER[b.priority] != null ? PRIORITY_ORDER[b.priority] : 99;
        return pa - pb;
      });
    }

    var html = '';

    if (!openIssues.length) {
      html += '<p class="empty-message">未解決課題なし ✅</p>';
    } else {
      sortByPriority(openIssues).forEach(function (issue) {
        html += buildIssueCard(issue);
      });
    }

    if (resolvedIssues.length) {
      html += '<details class="resolved-issues-details" style="margin-top:16px;">' +
        '<summary class="resolved-issues-summary" style="cursor:pointer;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-weight:600;color:#166534;list-style:none;display:flex;align-items:center;gap:8px;">' +
          '<span>▶</span>' +
          '<span>解決済み / アーカイブ (' + resolvedIssues.length + '件)</span>' +
        '</summary>' +
        '<div class="resolved-issues-body" style="margin-top:8px;">';
      sortByPriority(resolvedIssues).forEach(function (issue) {
        html += buildIssueCard(issue);
      });
      html += '</div></details>';
    }

    el('issues-list').innerHTML = html;

    // Rotate arrow on open/close
    var details = el('issues-list').querySelector('.resolved-issues-details');
    if (details) {
      details.addEventListener('toggle', function () {
        var arrow = details.querySelector('summary span');
        if (arrow) arrow.textContent = details.open ? '▼' : '▶';
      });
    }
  }

  /* ----------------------------------------------------------
     Filter Events
  ---------------------------------------------------------- */
  function initFilters() {
    el('filter-search').addEventListener('input', function () {
      state.filterSearch = this.value; applyFilters();
    });
    el('filter-status').addEventListener('change', function () {
      state.filterStatus = this.value; applyFilters();
    });
    el('filter-priority').addEventListener('change', function () {
      state.filterPriority = this.value; applyFilters();
    });
    el('filter-cpsc').addEventListener('change', function () {
      state.filterCpsc = this.value; applyFilters();
    });
    el('filter-reset').addEventListener('click', function () {
      el('filter-search').value = '';
      el('filter-status').value = 'all';
      el('filter-priority').value = 'all';
      el('filter-cpsc').value = 'all';
      state.filterSearch = ''; state.filterStatus = 'all';
      state.filterPriority = 'all'; state.filterCpsc = 'all';
      applyFilters();
    });
  }

  /* ----------------------------------------------------------
     Tab Switching
  ---------------------------------------------------------- */
  function initTabs() {
    var buttons = document.querySelectorAll('.tab-button');
    var contents = document.querySelectorAll('.tab-content');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-tab');
        buttons.forEach(function (b) { b.classList.remove('tab-button--active'); });
        contents.forEach(function (c) { c.style.display = 'none'; });
        btn.classList.add('tab-button--active');
        var target = el('tab-' + tabId);
        if (target) target.style.display = '';
      });
    });
  }

  /* ----------------------------------------------------------
     Workflow Steps Data
  ---------------------------------------------------------- */
  var WORKFLOW_STEPS = [
    {
      id: 1,
      title: '事前調査',
      what: [
        '対象カテゴリの eBay Taxonomy API Aspect 一覧を確認 (必須・推奨フィールド)',
        '既存の 74 カテゴリ俯瞰レポート (<code>~/.tmux-harness/sessions/harness-20260412-234052/reports/73-categories-overview.json</code>) から該当カテゴリを抽出',
        '現在の <code>IS_CATEGORY_FIELDS[カテゴリ名]</code> を <code>ItemSpecifics/Config_IS.gs</code> から確認',
        '<code>prompts/&lt;カテゴリ&gt;.txt</code> の現状確認 (存在有無、ABSOLUTE RULES 有無、Bootleg 語彙有無)',
        '<code>Sanitize.gs</code> の <code>SANITIZE_FIELDS_</code> / <code>CATEGORY_RULES_</code> に該当エントリがあるか確認',
        '類似カテゴリの完了パターンを参考に'
      ],
      conditions: [
        '上記 5 項目すべて確認済み、結果を Sprint Contract に記録',
        'eBay 必須フィールドのリストが明確'
      ],
      files: ['ItemSpecifics/Config_IS.gs', 'prompts/*.txt', 'Sanitize.gs', '234052 レポート']
    },
    {
      id: 2,
      title: '① IS フィールド精査 (目標: 21 → 実用数)',
      what: [
        'eBay 必須フィールドを必ず含める',
        'eBay 推奨フィールドのうち実用的なものを優先',
        '実際にはデータが埋まらないフィールドを削除 (目安: 10〜14 件に絞る)',
        'フィールドの優先順位 (p1〜) を再計算',
        '<code>ItemSpecifics/Config_IS.gs</code> の <code>IS_CATEGORY_FIELDS[カテゴリ名]</code> を編集',
        '<code>Library/Config_IS.gs</code> にも同じ変更を反映 (ライブラリ同期)'
      ],
      conditions: [
        'フィールド数が実用性ベース (21 → N)',
        '必須フィールドが全て含まれている',
        '<code>diff Library/Config_IS.gs ItemSpecifics/Config_IS.gs</code> → exit 0'
      ],
      files: ['ItemSpecifics/Config_IS.gs', 'Library/Config_IS.gs']
    },
    {
      id: 3,
      title: '② Sanitize 連動確認',
      what: [
        'Step 2 で精査したフィールドが <code>Sanitize.gs</code> の <code>SANITIZE_FIELDS_[カテゴリ]</code> で定義されているか確認',
        '未定義のフィールドは追加 (または意図的に non-sanitize と判断)',
        '<code>CATEGORY_RULES_[カテゴリ]</code> も必要に応じて更新',
        '日本語 → 英語変換マッピング (<code>FIELD_EN_TO_JP_</code>) の整合確認',
        '<code>Library/Sanitize.gs</code> にも同じ変更を反映'
      ],
      conditions: [
        '精査後のフィールドすべてに対応する Sanitize ルールがある (または意図的に non-sanitize の判断が記録されている)',
        '<code>diff Library/Sanitize.gs Sanitize.gs</code> → exit 0'
      ],
      files: ['Sanitize.gs', 'Library/Sanitize.gs']
    },
    {
      id: 4,
      title: '③ プロンプト編集',
      what: [
        '<code>prompts/&lt;カテゴリ&gt;.txt</code> を編集 (専用プロンプトがない場合は共用先を確認または新規作成)',
        '<code>## ABSOLUTE RULES</code> セクション追加',
        '<code>## LEGITIMATE KEYWORDS</code> セクション追加 (Bootleg, KO, Knock-off, Replica, Fake, 海賊版, 模倣, コピー品 は絶対に含めない)',
        '4 マーカー構造 (<code>TITLE MARKER</code> / <code>DESCRIPTION MARKER</code> / <code>BULLET MARKER</code> / <code>FEATURE MARKER</code>) の導入',
        'ABSOLUTE RULES の禁止語リストに英語+日本語の禁止語を追加',
        'プロンプト変更した場合は <code>Library/PromptTemplates.gs</code> にも反映'
      ],
      conditions: [
        '<code>grep -c "ABSOLUTE RULES" prompts/&lt;カテゴリ&gt;.txt</code> → 1 以上',
        '<code>grep -E "Bootleg|KO|Knock-off|Replica" prompts/&lt;カテゴリ&gt;.txt</code> → 0 件',
        '<code>Library/PromptTemplates.gs</code> との同期確認 OK'
      ],
      files: ['prompts/&lt;カテゴリ&gt;.txt', 'Library/PromptTemplates.gs']
    },
    {
      id: 5,
      title: '④ 固定値注入 (必要な場合のみ)',
      what: [
        '<code>ItemSpecifics/ItemSpecifics.gs</code> の <code>resolveFieldValue_()</code> を編集',
        '<b>Country of Origin</b>: 日本製のみのカテゴリ (例: 日本刀、茶道具) に <code>"Japan"</code> を注入',
        '<b>Theme</b>: コレクター系で共通テーマがあるカテゴリ (例: Figures → <code>"Anime &amp; Manga"</code>)',
        '<b>Age Level</b>: CPSC 対応で年齢要件があるカテゴリ (例: Trading Cards → <code>"16+"</code>)',
        '<b>Features</b>: コレクター商品として明示するカテゴリ (例: <code>"Collectors Edition"</code>)',
        '<code>Library/ItemSpecifics.gs</code> にも同じ変更を反映'
      ],
      conditions: [
        '必要な固定値が注入されている、または「このカテゴリは④不要」と判断が記録されている',
        '<code>diff Library/ItemSpecifics.gs ItemSpecifics/ItemSpecifics.gs</code> → exit 0'
      ],
      files: ['ItemSpecifics/ItemSpecifics.gs', 'Library/ItemSpecifics.gs'],
      warning: '⚠️ Features 併記問題 (§8.1): AI 抽出値 (No Box; Opened 等) を上書き破壊するリスクあり。§8.1 の方針が未確定のカテゴリでは ④ Features 注入を保留。'
    },
    {
      id: 6,
      title: 'ライブラリ同期検証',
      what: [
        '変更したすべての .gs ファイルでルート ↔ Library の diff を取る',
        '差分 0 を確認'
      ],
      conditions: [
        '<code>diff Library/Config_IS.gs ItemSpecifics/Config_IS.gs</code> → exit 0',
        '<code>diff Library/ItemSpecifics.gs ItemSpecifics/ItemSpecifics.gs</code> → exit 0',
        '<code>diff Library/Sanitize.gs Sanitize.gs</code> (変更時) → exit 0'
      ],
      files: ['Library/*.gs']
    },
    {
      id: 7,
      title: 'ScriptProperties / HtmlTemplates / PromptTemplates チェック',
      what: [
        '<code>grep -rn "getScriptProperties" Library/*.gs</code> → 0 件確認',
        '.txt ファイル変更時は <code>python3 Library/convert_html_to_gs.py</code> で HtmlTemplates.gs 再生成',
        'prompts/ 変更時は <code>Library/PromptTemplates.gs</code> との sync チェック',
        'CLAUDE.md の「コミット前チェックリスト」全項目を実行'
      ],
      conditions: [
        'ScriptProperties 残存: 0 件',
        'HtmlTemplates の 13 テンプレート数が維持されている',
        'PromptTemplates.gs に <code>prompts/&lt;カテゴリ&gt;.txt</code> が含まれている (version インクリメント確認)'
      ],
      files: ['Library/HtmlTemplates.gs', 'Library/PromptTemplates.gs']
    },
    {
      id: 8,
      title: '親レビュー + child-c 独立レビュー (E-02)',
      what: [
        'Claude (親) が <code>git diff</code> を読んでレビュー (安全性・仕様準拠・動作確認・コード品質の 4 観点)',
        '<b>child-c (Claude Code) に独立レビューを依頼</b> — Gemini 禁止 (stall 実績あり)',
        '両者の結果を突き合わせ',
        '片方でも FAIL なら修正 → Step 8 に戻る (差し戻し 3 回で椛島さんに判断依頼)'
      ],
      conditions: [
        'Claude レビュー: PASS',
        'child-c 独立レビュー: PASS',
        '両者の指摘に矛盾なし'
      ],
      files: ['git diff', 'レビュー結果 JSON'],
      warning: '⚠️ <code>rules/code-review-evaluator.md</code> の E-02 採点基準に従う。Gemini は stall 実績があるため禁止。child-c (Claude Code Sonnet) を使うこと。'
    },
    {
      id: 9,
      title: '椛島さんへの承認依頼 + commit + push',
      what: [
        '椛島さんに完了報告 (変更ファイル一覧、commit メッセージ案、レビュー結果)',
        '承認を得る',
        '<code>git add &lt;ファイル&gt;</code> (特定ファイルのみ、<code>-A</code> 禁止)',
        '<code>git commit -m "feat(&lt;カテゴリ&gt;): IS &lt;旧&gt;→&lt;新&gt; + ABSOLUTE RULES + (必要なら)固定値注入"</code>',
        '<code>git push</code>'
      ],
      conditions: [
        '椛島さん承認済み',
        'git commit 成功、リモートに push 済み',
        'commit ハッシュを記録'
      ],
      files: ['git log']
    },
    {
      id: 10,
      title: 'clasp push (本番反映)',
      what: [
        '<code>clasp push</code> を実行 (Google Apps Script に反映)',
        'スプレッドシート側で動作確認 (可能なら)',
        'ルートと Library 両方を push (CLAUDE.md プロジェクト固有ルール)'
      ],
      conditions: [
        '<code>clasp push</code> 成功',
        'エラーなし'
      ],
      files: ['.clasp.json']
    },
    {
      id: 11,
      title: 'ダッシュボード + Obsidian ノート更新',
      what: [
        '<code>docs/progress/data.json</code> と <code>data.js</code> の該当カテゴリを更新',
        'Phase 1B 完全完了なら <code>phase_1b_started: true</code> + 各状態を <code>"completed"</code> に',
        '部分完了なら該当項目のみ更新',
        '<code>~/Desktop/開発ログ/</code> または Obsidian に Phase 1B &lt;カテゴリ名&gt; 完了記録を追記',
        'Discord 通知 (<code>~/.claude/scripts/notify-discord.sh</code>)'
      ],
      conditions: [
        'ダッシュボードに反映され、ブラウザで確認可能',
        'Obsidian ノート更新済み',
        'Discord 通知送信 (該当する場合)'
      ],
      files: ['docs/progress/data.json', 'docs/progress/data.js', '開発ログノート']
    }
  ];

  /* ----------------------------------------------------------
     Workflow Render
  ---------------------------------------------------------- */
  function buildStepCard(step) {
    var whatItems = step.what.map(function (item) {
      return '<li class="step-card__list-item">' + item + '</li>';
    }).join('');

    var condItems = step.conditions.map(function (item) {
      return '<li class="step-card__list-item step-card__list-item--check">' + item + '</li>';
    }).join('');

    var fileItems = step.files.map(function (f) {
      return '<code class="step-card__file">' + f + '</code>';
    }).join('');

    var warningHtml = step.warning
      ? '<div class="step-card__warning">' + step.warning + '</div>'
      : '';

    return '<div class="step-card" id="step-' + step.id + '">' +
      '<div class="step-card__header">' +
        '<span class="step-card__badge">Step ' + step.id + '</span>' +
        '<span class="step-card__title">' + esc(step.title) + '</span>' +
        '<span class="step-card__chevron">▾</span>' +
      '</div>' +
      '<div class="step-card__body">' +
        (warningHtml ? warningHtml : '') +
        '<div class="step-card__section">' +
          '<h4 class="step-card__section-title">何をする</h4>' +
          '<ul class="step-card__list">' + whatItems + '</ul>' +
        '</div>' +
        '<div class="step-card__section">' +
          '<h4 class="step-card__section-title">✅ 完了条件</h4>' +
          '<ul class="step-card__list">' + condItems + '</ul>' +
        '</div>' +
        '<div class="step-card__section step-card__section--files">' +
          '<h4 class="step-card__section-title">📁 関連ファイル</h4>' +
          '<div class="step-card__files">' + fileItems + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderWorkflow() {
    var container = el('workflow-container');
    if (!container) return;

    var introHtml = '<div class="workflow-intro">' +
      '<div class="workflow-intro__status" style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:6px;padding:10px 16px;margin-bottom:12px;">' +
        '<strong>✅ Phase 1B 完了 (2026-04-17)</strong> — 全 74 カテゴリ IS 精査・ABSOLUTE RULES 63 プロンプト・SANITIZE_FIELDS_ 完備。Books &amp; Magazines (Cat 74) 含む。' +
      '</div>' +
      '<div class="workflow-intro__next" style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:10px 16px;margin-bottom:12px;">' +
        '<strong>次フェーズ候補:</strong> ① Title 上限統一 (75 vs 80 文字) ② Sanitize 活用強化 ③ Books &amp; Magazines プロンプト調整 ④ Phase 5 IS_MAX_FIELDS 導入' +
      '</div>' +
      '<p class="workflow-intro__text">' +
        'Phase 1B を 1 カテゴリに対して実行する手順 (参考記録)。' +
        '以下の 11 ステップを順番に実行し、各ステップの完了条件を満たしてから次へ進む。' +
      '</p>' +
      '<div class="workflow-intro__legend">' +
        '<span class="workflow-legend-item"><span class="step-card__badge step-card__badge--sm">Step N</span> ステップ番号</span>' +
        '<span class="workflow-legend-item">🔶 警告あり</span>' +
        '<span class="workflow-legend-item">ヘッダクリックで折りたたみ</span>' +
      '</div>' +
    '</div>';

    var stepsHtml = WORKFLOW_STEPS.map(buildStepCard).join('');
    container.innerHTML = introHtml + stepsHtml;

    /* Bind step collapse toggles */
    var stepHeaders = container.querySelectorAll('.step-card__header');
    stepHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        var card = header.parentElement;
        card.classList.toggle('step-card--collapsed');
      });
    });
  }

  /* ----------------------------------------------------------
     Design Tab Data
  ---------------------------------------------------------- */
  var DESIGN_CONTENT = [
    {
      id: 'overview',
      title: '1. 目的と現状',
      body: '<dl class="design-dl">' +
        '<div class="design-dl__row"><dt>目的</dt><dd>一括シートV3 は椛島さんが<strong>複数ユーザーに配布・販売する SaaS プロダクト</strong> (Google Apps Script ベース)。eBay 商品の一括出品を効率化するツール。</dd></div>' +
        '<div class="design-dl__row"><dt>バージョン</dt><dd>v108 (2026-04-13)</dd></div>' +
        '<div class="design-dl__row"><dt>最新コミット</dt><dd><code>7ed0832</code> (2026-04-17 Books &amp; Magazines Cat 74 追加 + Phase 1B 完了)</dd></div>' +
        '<div class="design-dl__row"><dt>プロジェクトパス</dt><dd><code>~/Desktop/ツール開発/一括シートApps_v3/</code></dd></div>' +
        '<div class="design-dl__row"><dt>ライブラリ同期状態</dt><dd><strong>in-sync</strong> — <code>diff Library/Config_IS.gs ItemSpecifics/Config_IS.gs</code> 等で随時確認</dd></div>' +
        '<div class="design-dl__row"><dt>総コミット数</dt><dd>697 件</dd></div>' +
      '</dl>'
    },
    {
      id: 'pipeline',
      title: '2. パイプライン',
      body: '<pre class="pipeline-diagram">' +
        '[作業シート] (椛島さんが入力)\n' +
        '      │ 仕入値・タグ(D列)・商品名・画像等\n' +
        '      ▼\n' +
        '[Translation.gs]     タグ → PROMPT_TAG_MAPPING で翻訳プロンプト選定\n' +
        '      ▼\n' +
        '[AI.gs]              OpenAI API、翻訳・交通整理・IS 自動抽出\n' +
        '      ▼\n' +
        '[Sanitize.gs]        sanitizeInputJP_ → sanitizeListingText_\n' +
        '      │              SANITIZE_FIELDS_ / CATEGORY_RULES_ 参照\n' +
        '      ▼\n' +
        '[ItemSpecifics.gs]   IS_TAG_TO_CATEGORY → IS_CATEGORY_FIELDS\n' +
        '      │              resolveFieldValue_() 固定値注入 (Country/Theme/Age Level/Features)\n' +
        '      ▼\n' +
        '[Shipping.gs]        送料計算 (TABLE/FIXED/GAME_CARD/TAG_SHIPPING 4 モード)\n' +
        '      ▼\n' +
        '[出品用シート]        結果集約\n' +
        '      │\n' +
        '      ▼\n' +
        '[EAGLE] (外部ツール、このリポジトリ外)\n' +
        '      │              出品用シートを読む\n' +
        '      ▼\n' +
        '[eBay API]           Trading API' +
        '</pre>' +
        '<p class="design-note">※ このプロジェクトの責務は <strong>EAGLE が読む「出品用シート」を正しく作ること</strong> まで。eBay API への直接送信は EAGLE が担当 (このリポジトリ外)。EAGLE 上限 30 フィールド / アイテム。</p>'
    },
    {
      id: 'phases',
      title: '3. Phase 定義',
      body: '<table class="design-table">' +
        '<thead><tr><th>Phase</th><th>内容</th><th>ステータス</th><th>詳細</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>Phase 1A</td><td>IS_CATEGORY_FIELDS を全 74 カテゴリで 10→21 フィールドに拡張</td><td>✅ 完了</td><td>第 1〜12 弾 + Books &amp; Magazines (Cat 74) コミット完了。is-expansion-design.md 参照。</td></tr>' +
        '<tr><td>Phase 1B</td><td>拡張後の実用性精査 + プロンプト強化 + 固定値注入</td><td>✅ 完了</td><td>全 74 カテゴリ IS 精査完了。ABSOLUTE RULES + Rule 2 (Category A/B/C) を 63 プロンプトに適用。SANITIZE_FIELDS_ 74 カテゴリ完備。案 C 部分分割 (楽器系 3 プロンプト体制) 含む。</td></tr>' +
        '<tr><td>Phase 2</td><td>ItemSpecifics × 交通整理 統合 (確定値ロック、バリデーション)</td><td>🟢 ほぼ完了</td><td>getSanitizeFields_() + buildDefaultSanitizePrompt_() 実装済み (全 74 カテゴリ対応)。validateItemSpecifics_() 動作確認が残課題。</td></tr>' +
        '<tr><td>Phase 3</td><td>CPSC Age Level 対応 (2026/7/8 施行)</td><td>🟡 進行中</td><td>Trading Cards / Japanese Dolls / Figures / Mecha / RC / Manga / Anime / Snow Globes 対応済み。Japanese Dolls (Taxonomy 35792) Age Level Aspect 確認が残課題。</td></tr>' +
        '<tr><td>Phase 4</td><td>送料モード共通関数化 (Formula Factory)</td><td>✅ 完了</td><td>3 共通関数 + 8 箇所で使用確認済み。shipping-mode-refactor-plan.md 参照。</td></tr>' +
        '<tr><td>Phase 5</td><td>IS_MAX_FIELDS=20 定数 + CONFIRMED_EN 動的計算</td><td>⏸ 未実装</td><td>is-expansion-design.md §5.1。IS_MAX_FIELDS 定数が Config_IS.gs に未存在 (grep 確認済み)。Phase 1B 完了を受けて着手予定。</td></tr>' +
        '</tbody>' +
        '</table>'
    },
    {
      id: 'four-items',
      title: '4. 椛島さんの 4 項目と Phase 対応',
      body: '<p class="design-p">椛島さんが 2026-04-15 に明示した「今やっている改修の 4 項目」:</p>' +
        '<table class="design-table">' +
        '<thead><tr><th>椛島さんの指示</th><th>対応 Phase</th><th>詳細</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>① IS フィールド精査 (21 → 実用数)</td><td>Phase 1B</td><td>21 に拡張した後、実際には埋まらないフィールドをカテゴリごとに削減 (目安 10〜14)</td></tr>' +
        '<tr><td>② 交通整理関数の連動確認</td><td>Phase 1B + Phase 2</td><td>精査後のフィールドが Sanitize.gs の SANITIZE_FIELDS_ / CATEGORY_RULES_ で正しく定義されているか確認</td></tr>' +
        '<tr><td>③ プロンプト編集 (不要ワード排除)</td><td>Phase 1B</td><td>ABSOLUTE RULES + LEGITIMATE KEYWORDS 導入、Bootleg / KO / Replica / Knock-off 削除</td></tr>' +
        '<tr><td>④ IS 自動出力 (Age Level / Features=Collectors)</td><td>Phase 1B + Phase 3</td><td>resolveFieldValue_() 固定値注入 (Country / Theme / Age Level / Features)。CPSC 対応含む。</td></tr>' +
        '</tbody>' +
        '</table>'
    },
    {
      id: 'category-map',
      title: '5. カテゴリ番号対応表 (旧 Track A Cat → 74 正式番号)',
      body: '<p class="design-p">2026-04-14 以降は <strong>GAS カテゴリ名 + 74 正式番号</strong> を正式呼称とする (例: <code>Figures (Cat 10)</code>)。旧 Track A Cat 番号は段階的に廃止。</p>' +
        '<table class="design-table design-table--compact">' +
        '<thead><tr><th>旧 Cat (Track A)</th><th>GAS カテゴリ名</th><th>74 正式番号</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>01</td><td>Trading Cards</td><td>15</td></tr>' +
        '<tr><td>02</td><td>Video Game Consoles</td><td>38</td></tr>' +
        '<tr><td>03</td><td>Video Game Accessories</td><td>36</td></tr>' +
        '<tr><td>04</td><td>Fishing Lures</td><td>45</td></tr>' +
        '<tr><td>05</td><td>Japanese Dolls</td><td>67</td></tr>' +
        '<tr><td>06</td><td>Japanese Swords</td><td>65</td></tr>' +
        '<tr><td>07</td><td>Tea Ceremony</td><td>68</td></tr>' +
        '<tr><td>08</td><td>Bonsai</td><td>11</td></tr>' +
        '<tr><td>09</td><td>Buddhist Art</td><td>69</td></tr>' +
        '<tr><td>10</td><td>Tetsubin</td><td>51</td></tr>' +
        '<tr><td>11</td><td>Pottery</td><td>70</td></tr>' +
        '<tr><td>12</td><td>Kakejiku</td><td>71</td></tr>' +
        '<tr><td>13</td><td>Kimono</td><td>66</td></tr>' +
        '<tr><td>14</td><td>Prints</td><td>19</td></tr>' +
        '<tr><td>15</td><td>Art</td><td>18</td></tr>' +
        '<tr><td>16</td><td>Figures</td><td>10</td></tr>' +
        '<tr><td>17</td><td>Mecha Model Kits</td><td>31</td></tr>' +
        '<tr><td>18</td><td>RC &amp; Models</td><td>48</td></tr>' +
        '<tr><td>19</td><td>Manga</td><td>72</td></tr>' +
        '<tr><td>20</td><td>Anime</td><td>46</td></tr>' +
        '<tr><td>21</td><td>Snow Globes</td><td>55</td></tr>' +
        '<tr><td>—</td><td>Books &amp; Magazines</td><td>74</td></tr>' +
        '</tbody>' +
        '</table>'
    },
    {
      id: 'rules',
      title: '6. 作業手順と検証ルール',
      body: '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">6.1 ライブラリ同期チェックコマンド</h4>' +
          '<ul class="design-ul">' +
            '<li><code>diff Library/Config_IS.gs ItemSpecifics/Config_IS.gs</code> → exit 0</li>' +
            '<li><code>diff Library/ItemSpecifics.gs ItemSpecifics/ItemSpecifics.gs</code> → exit 0</li>' +
            '<li><code>diff Library/Sanitize.gs Sanitize.gs</code> (変更時) → exit 0</li>' +
            '<li><code>grep -rn "getScriptProperties" Library/*.gs</code> → 0 件</li>' +
            '<li>.txt 変更時: <code>python3 Library/convert_html_to_gs.py</code> → HtmlTemplates.gs 再生成</li>' +
            '<li>prompts/ 変更時: PromptTemplates.gs との sync チェック (version インクリメント)</li>' +
          '</ul>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">6.2 禁止事項</h4>' +
          '<ul class="design-ul">' +
            '<li>ルートの .gs ファイルをそのまま Library/ にコピーしない (HtmlService / ScriptProperties 差異あり)</li>' +
            '<li>ScriptProperties をライブラリ内で使わない → DocumentProperties を使う</li>' +
            '<li>推測で仕様・セル番地・バージョンを発言しない</li>' +
            '<li>eBay API へのブラウザ操作 / スクレイピング禁止</li>' +
            '<li>git add -A 禁止 → 特定ファイルのみ指定</li>' +
          '</ul>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">6.3 コミット前チェックリスト</h4>' +
          '<ol class="design-ol design-checklist">' +
            '<li>ScriptProperties チェック: <code>grep -rn "getScriptProperties" Library/*.gs</code> → 0 件</li>' +
            '<li>ルート ↔ Library 同期チェック: diff で全ファイル exit 0</li>' +
            '<li>.txt 変更時: HtmlTemplates.gs 再生成 → 13 テンプレート数維持</li>' +
            '<li>prompts/ 変更時: PromptTemplates.gs sync + version インクリメント確認</li>' +
            '<li>git status / git diff --stat で変更ファイルを最終確認</li>' +
          '</ol>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">6.4 レビュー (E-02)</h4>' +
          '<ul class="design-ul">' +
            '<li>Claude (親) が git diff を読んでレビュー (安全性・仕様準拠・動作確認・コード品質)</li>' +
            '<li><strong>child-c (Claude Code) に独立レビューを依頼</strong></li>' +
            '<li>両者 PASS → 椛島さんに承認依頼</li>' +
            '<li>片方 FAIL → 修正 → Step 8 に戻る (差し戻し 3 回で椛島さんに判断依頼)</li>' +
          '</ul>' +
          '<p class="design-warning">⚠️ Gemini 禁止: Gemini は stall 実績あり (2026-04-12 確認、2026-04-13 椛島さん決定)。E-02 独立レビュワー = child-c</p>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">6.5 3者協議</h4>' +
          '<ul class="design-ul">' +
            '<li>複雑な改修の方針決定・影響範囲が広い変更には 3 者協議を実施</li>' +
            '<li>協議手順: <code>get_all_opinions</code> → <code>multi_discuss</code> → <code>consensus</code></li>' +
            '<li>3 者全員一致は警戒信号 → WebSearch 等で裏取り</li>' +
            '<li>未検証の事実を「バグ」「存在しない」等と断定して協議に持ち込まない</li>' +
          '</ul>' +
        '</div>'
    }
  ];

  function buildDesignSection(section) {
    return '<div class="design-section" id="design-' + section.id + '">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">' + esc(section.title) + '</h3>' +
      '</div>' +
      '<div class="design-section__body">' + section.body + '</div>' +
    '</div>';
  }

  function renderDesign() {
    var container = el('design-container');
    if (!container) return;
    container.innerHTML = DESIGN_CONTENT.map(buildDesignSection).join('');
    var headers = container.querySelectorAll('.design-section__header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        header.parentElement.classList.toggle('design-section--collapsed');
      });
    });
  }

  /* ----------------------------------------------------------
     Prompt Edit Workflow Data
  ---------------------------------------------------------- */
  var PROMPT_PRINCIPLES = [
    {num: 1, rule: '行数は短く (100-120 行)', violation: 'V49: 305 行', impact: '指示追従率低下'},
    {num: 2, rule: 'Translation Dictionary は入れない', violation: 'V49/V51: 100 行辞書', impact: '指示分散'},
    {num: 3, rule: 'ABSOLUTE RULES を多段化しない', violation: 'V49 Rule 2 Cat A/B/C 40 行', impact: '解釈負荷'},
    {num: 4, rule: 'Few-shot Example を偏らせない', violation: 'V50 Japanese Example 1 → 29/35 誤発火', impact: '過学習'},
    {num: 5, rule: '多段 note / 条件分岐を避ける', violation: 'V50 Rule 6 末尾 3 note', impact: '解釈負荷'},
    {num: 6, rule: '文字数レンジは狭く (7-10 字幅)', violation: 'V50/V51: 40-80 (40 字幅)', impact: '出力品質不安定'},
    {num: 7, rule: 'VERIFICATION は 13 項目程度', violation: 'V50: 19 項目', impact: '後半無視'},
    {num: 8, rule: '固定値注入をプロンプトに持ち込まない', violation: 'V49 Country of Origin rule', impact: 'GAS 整合性ズレ'}
  ];

  /* v2.0: 11-Section Structure Template */
  var SECTION_TEMPLATE = [
    {num: 1,  name: 'IDENTITY',        lines: '1 行',       desc: '専門家役割宣言'},
    {num: 2,  name: 'GOALS',           lines: '5 行',       desc: '4 原則: Japanese→English / ASCII only / no verbatim / no hallucination'},
    {num: 3,  name: 'TITLE',           lines: '7 行',       desc: '68-75 chars / allowed + forbidden symbols / no guarantees'},
    {num: 4,  name: 'SEO_ORDER',       lines: '9 行',       desc: 'Brand first 30 chars、最大 8 items (カテゴリ固有スペック)'},
    {num: 5,  name: 'CATEGORY_RULE',   lines: '5-15 行',    desc: 'カテゴリ固有高リスク抑制 (optional — 不要なら削除)'},
    {num: 6,  name: 'DESCRIPTION',     lines: '30-40 行',   desc: '≤480 chars / first sentence = brand+model+type / DEFECT サブセクション必須'},
    {num: 7,  name: 'PRODUCTNAME',     lines: '3 行',       desc: '[Brand] [Collection/Model] [Type]'},
    {num: 8,  name: 'CATEGORY',        lines: '5 行',       desc: 'eBay category assignment'},
    {num: 9,  name: 'OUTPUT_FORMAT',   lines: '5 行',       desc: '4 フィールド (Title / Description / ProductName / Category)'},
    {num: 10, name: 'VERIFICATION',    lines: '13 項目',    desc: 'items 1-5 共通 + defect check 必須 + source-only check 必須'},
    {num: 11, name: 'INPUT',           lines: '2 行',       desc: 'Input: ${fullText}'}
  ];

  /* v2.0: 基盤機能リスト M-1〜M-6 */
  var BASELINE_FUNCTIONS = [
    {
      id: 'M-1',
      title: 'GOALS 4 原則',
      required: true,
      detail: 'Japanese source → English eBay listing / ASCII only, no CJK / Never copy source verbatim / ONLY explicitly stated info (no hallucination)',
      ebay_policy: false
    },
    {
      id: 'M-2',
      title: 'DEFECT/ISSUE REPORTING (CRITICAL)',
      required: true,
      detail: 'DESCRIPTION 内サブセクション。① イントロ文 ② カテゴリ固有 defect keywords 3 件以上 (JP→EN) ③ "Omitting known defects is a violation of eBay policy." 完全一致文言',
      ebay_policy: true
    },
    {
      id: 'M-3',
      title: 'OUTPUT_FORMAT 4 フィールド',
      required: true,
      detail: 'Title: ... / Description: ... / ProductName: ... / Category: ...',
      ebay_policy: false
    },
    {
      id: 'M-4',
      title: 'VERIFICATION 最低構造',
      required: true,
      detail: '13 項目目標。必須: items 1-5 (文字数/ASCII/禁止CJK/Brand位置/禁止記号) + defect check + source-only check (no hallucination)',
      ebay_policy: false
    },
    {
      id: 'M-5',
      title: '${fullText} 入力',
      required: true,
      detail: '最終行に Input: ${fullText}。GAS の変数展開によりソースデータが注入される。',
      ebay_policy: false
    },
    {
      id: 'M-6',
      title: 'AUTHENTIC/OFFICIAL BAN',
      required: true,
      detail: 'Rule 2 (または ABSOLUTE RULES) に AUTHENTIC/OFFICIAL 使用禁止ルール (eBay VeRO 保護)。',
      ebay_policy: true
    }
  ];

  /* v2.0: Reference Implementations */
  var REFERENCE_IMPLEMENTATIONS = [
    {
      id: 'reel-v2',
      label: 'リール V2.0',
      status: 'READY',
      file: 'prompts/リール.txt',
      lines: 101,
      commit: '050ae33',
      purpose: 'Standard Reference — 全カテゴリ改修の出発点',
      type: 'スポーツ・機械系',
      description: '11 セクション構造・GOALS 4 原則・Rule 2 (NO PADDING + AUTHENTIC/OFFICIAL BAN + GENUINE/ORIGINAL + RARE/LIMITED)・DEFECT/ISSUE REPORTING (5 JP→EN keywords)・MISSING ACCESSORIES (5 pairs)・VERIFICATION (13 items) の完全実装例。'
    },
    {
      id: 'japanese-dolls-v2',
      label: '日本人形 V2.0',
      status: 'PLANNED (Step 2)',
      file: 'prompts/日本人形.txt',
      lines: null,
      commit: null,
      purpose: '美術品・骨董系 Reference — 日本人形/掛軸/盆栽/仏教美術/茶道具/陶磁器 等',
      type: '美術品・骨董系',
      description: 'ANTIQUE/HANDMADE whitelist・文化財固有 DEFECT keywords・骨董品 VERIFICATION 追加予定。'
    },
    {
      id: 'soap-v2',
      label: '石鹸 V2.0',
      status: 'PLANNED (Step 2)',
      file: 'prompts/石鹸.txt',
      lines: null,
      commit: null,
      purpose: '食品・消費財系 Reference — 石鹸/パイプ・喫煙具/一般商品・汎用 等',
      type: '食品・消費財系',
      description: 'シンプルカテゴリ (90-110 行)・M-2 DEFECT サブセクション追加 (M-2 部分修正から派生予定)。'
    },
    {
      id: 'camera-v2',
      label: 'カメラ V2.0',
      status: 'NEEDS_VERIFICATION',
      file: 'prompts/カメラ.txt',
      lines: 130,
      commit: null,
      purpose: '電子機器系 Reference — カメラ/オーディオ・家電/ゲーム機/ゲーム用 等 (v2.0 基準適合確認必要)',
      type: '電子機器系',
      description: 'SHUTTER COUNT RULE 有り。v2.0 基準 (M-1〜M-6 全項目) 適合確認後に READY 昇格予定。'
    },
    {
      id: 'apparel-v2',
      label: '衣類・アクセサリ V2.0',
      status: 'PLANNED (Step 2)',
      file: null,
      lines: null,
      commit: null,
      purpose: '衣類・アクセサリ系 Reference — アパレル・ブランド品/スニーカー/着物/サングラス/レザーグッズ 等',
      type: '衣類・アクセサリ系',
      description: 'アパレル・ブランド品.txt を v2.0 化して reference 化予定。'
    }
  ];

  /* v2.0: 差し替え項目チェックリスト (リール V2.0 → 新カテゴリ) */
  var SUBSTITUTION_ITEMS = [
    {
      num: 1,
      item: 'IDENTITY 専門分野',
      reel_example: '"fishing reels and SEO optimization"',
      policy: 'カテゴリ固有に差し替え (例: golf clubs / watches / cameras)',
      shared: false
    },
    {
      num: 2,
      item: 'GOALS L7 hallucination 例示スペック',
      reel_example: '"gear ratio, ball bearings count, or line capacity"',
      policy: 'カテゴリ固有スペック例に差し替え (例: loft / shaft flex / camera model / shutter count)',
      shared: false
    },
    {
      num: 3,
      item: 'SEO_ORDER items 2-7 (Brand 除く)',
      reel_example: 'Model line / Size / Reel type / Gear info / Hand retrieve / Bonus',
      policy: 'カテゴリ固有 SEO 要素に差し替え (例: Club Type / Loft / Shaft / Flex / Hand)',
      shared: false
    },
    {
      num: 4,
      item: 'CATEGORY_RULE (optional)',
      reel_example: 'SIZE/NUMBER RULE + GEAR CODE RULE',
      policy: 'カテゴリ固有高リスク抑制に差し替え。不要なら省略可 (LOFT/NUMBER / WRIST / SHUTTER COUNT 等)',
      shared: false
    },
    {
      num: 5,
      item: 'DESCRIPTION スペックリスト',
      reel_example: 'gear ratio / bearings / drag / line capacity / hand retrieve / body material',
      policy: 'カテゴリ固有スペックに差し替え (例: loft / shaft / length / camera sensor / shutter count)',
      shared: false
    },
    {
      num: 6,
      item: '<strong style="color:#dc2626;">DEFECT JP→EN keywords (CRITICAL — 3 件以上必須)</strong>',
      reel_example: 'ゴリ感/ベール不良/ドラグ不良/逆転不良/ハンドルガタ (5 件)',
      policy: 'カテゴリ固有欠陥用語に差し替え必須 (例: フェース傷/シャフト折れ/グリップ劣化/ヘッドクラック for Golf)',
      shared: false
    },
    {
      num: 7,
      item: 'MISSING ACCESSORIES 5 pairs',
      reel_example: '予備スプールなし / ハンドルなし / ハンドルノブなし / 箱なし / 取説なし',
      policy: 'カテゴリ固有付属品に差し替え (例: ヘッドカバーなし / レンチなし / ケースなし for Golf)',
      shared: false
    },
    {
      num: 8,
      item: 'PRODUCTNAME Examples',
      reel_example: 'Shimano Stella 4000XG Spinning Reel / Daiwa Steez SV TW Baitcasting Reel',
      policy: 'カテゴリ固有 brand+model+type 例に差し替え (例: Titleist TSR3 Driver / Canon EOS 5D Mark IV)',
      shared: false
    },
    {
      num: 9,
      item: 'CATEGORY 値 (3 パターン)',
      reel_example: 'Fishing Reels / Reel Parts &amp; Repair / N/A',
      policy: 'eBay カテゴリ名に差し替え (例: Golf Clubs / Golf Club Parts / Cameras &amp; Photo / Wristwatches)',
      shared: false
    },
    {
      num: 10,
      item: 'VERIFICATION items 6-13 (カテゴリ固有)',
      reel_example: 'SIZE/NUMBER 포함 / left-hand conditional / defect in Description / reel-specific defects accurate',
      policy: 'カテゴリ固有 Verification に差し替え (例: loft/number / left-handed / shutter count / camera-specific defects)',
      shared: false
    }
  ];

  /* v2.0: 74 カテゴリ × 5 商品タイプ分類 */
  var CATEGORY_TYPE_MAP = [
    {
      type_id: 1,
      type_name: 'スポーツ・機械系',
      reference: 'リール V2.0 (READY)',
      reference_id: 'reel-v2',
      description: '精密機械・スポーツ用品。GEAR CODE RULE / SIZE/NUMBER RULE 等のカテゴリ固有 RULE 有り。',
      categories: [
        {cat_no: 1,  name: 'Watches'},
        {cat_no: 7,  name: 'Fishing Rods'},
        {cat_no: 16, name: 'Golf'},
        {cat_no: 23, name: 'Fishing Reels'},
        {cat_no: 29, name: 'Baseball'},
        {cat_no: 31, name: 'Mecha Model Kits'},
        {cat_no: 42, name: 'Golf Heads'},
        {cat_no: 45, name: 'Fishing Lures'},
        {cat_no: 48, name: 'RC & Models'},
        {cat_no: 56, name: 'Watch Parts'},
        {cat_no: 62, name: 'Kitchen Knives'},
        {cat_no: 63, name: 'Tennis'}
      ]
    },
    {
      type_id: 2,
      type_name: '美術品・骨董系',
      reference: '日本人形 V2.0 (PLANNED Step 2)',
      reference_id: 'japanese-dolls-v2',
      description: '日本文化・骨董・美術品。ANTIQUE/HANDMADE whitelist 有り。文化財固有 DEFECT keywords 必要。',
      categories: [
        {cat_no: 10, name: 'Figures'},
        {cat_no: 11, name: 'Bonsai'},
        {cat_no: 18, name: 'Art'},
        {cat_no: 19, name: 'Prints'},
        {cat_no: 24, name: 'Collectibles'},
        {cat_no: 51, name: 'Tetsubin'},
        {cat_no: 54, name: 'Coins'},
        {cat_no: 57, name: 'Stamps'},
        {cat_no: 65, name: 'Japanese Swords'},
        {cat_no: 67, name: 'Japanese Dolls'},
        {cat_no: 68, name: 'Tea Ceremony'},
        {cat_no: 69, name: 'Buddhist Art'},
        {cat_no: 70, name: 'Pottery'},
        {cat_no: 71, name: 'Kakejiku'}
      ]
    },
    {
      type_id: 3,
      type_name: '食品・消費財系',
      reference: '石鹸 V2.0 (PLANNED Step 2)',
      reference_id: 'soap-v2',
      description: 'シンプル消費財・生活用品・メディア。CATEGORY_RULE 省略可。行数目標 90-110 行。',
      categories: [
        {cat_no: 15, name: 'Trading Cards'},
        {cat_no: 17, name: 'Dolls & Plush'},
        {cat_no: 20, name: 'Dinnerware'},
        {cat_no: 26, name: 'Records'},
        {cat_no: 27, name: 'Soap'},
        {cat_no: 30, name: 'Key Chains'},
        {cat_no: 39, name: 'Boxes'},
        {cat_no: 46, name: 'Anime'},
        {cat_no: 47, name: 'Combs'},
        {cat_no: 50, name: 'Glassware'},
        {cat_no: 55, name: 'Snow Globes'},
        {cat_no: 59, name: 'Pens'},
        {cat_no: 61, name: 'Flatware'},
        {cat_no: 64, name: 'Pipes'},
        {cat_no: 72, name: 'Manga'},
        {cat_no: 73, name: 'Baby'},
        {cat_no: 74, name: 'Books & Magazines'}
      ]
    },
    {
      type_id: 4,
      type_name: '電子機器系',
      reference: 'カメラ V2.0 (NEEDS_VERIFICATION)',
      reference_id: 'camera-v2',
      description: '電子機器・楽器・ゲーム。SHUTTER COUNT RULE 等の技術固有 RULE 有り。電子部品 DEFECT keywords 必要。',
      categories: [
        {cat_no: 14, name: 'Electronics'},
        {cat_no: 22, name: 'Cameras'},
        {cat_no: 25, name: 'Guitars'},
        {cat_no: 36, name: 'Video Game Accessories'},
        {cat_no: 38, name: 'Video Game Consoles'},
        {cat_no: 40, name: 'Musical Instruments'},
        {cat_no: 44, name: 'Video Games'},
        {cat_no: 52, name: 'Synths & Digital'},
        {cat_no: 53, name: 'Effects & Amps'},
        {cat_no: 60, name: 'Japanese Instruments'}
      ]
    },
    {
      type_id: 5,
      type_name: '衣類・アクセサリ系',
      reference: '未作成 (PLANNED Step 2)',
      reference_id: 'apparel-v2',
      description: '衣類・バッグ・ジュエリー・アクセサリ。サイズ表記・素材記述・ブランド認証 DEFECT 固有。',
      categories: [
        {cat_no: 2,  name: 'Necklaces'},
        {cat_no: 3,  name: 'Bracelets'},
        {cat_no: 4,  name: 'Cufflinks'},
        {cat_no: 5,  name: 'Charms'},
        {cat_no: 6,  name: 'Handbags'},
        {cat_no: 8,  name: 'Earrings'},
        {cat_no: 9,  name: 'Rings'},
        {cat_no: 12, name: 'Shoes'},
        {cat_no: 13, name: 'Clothing'},
        {cat_no: 21, name: 'Brooches'},
        {cat_no: 28, name: 'Scarves'},
        {cat_no: 32, name: 'Tie Accessories'},
        {cat_no: 33, name: 'Neckties'},
        {cat_no: 34, name: 'Belts'},
        {cat_no: 35, name: 'Belt Buckles'},
        {cat_no: 37, name: 'Sunglasses'},
        {cat_no: 41, name: 'Hats'},
        {cat_no: 43, name: 'Hair Accessories'},
        {cat_no: 49, name: 'Handkerchiefs'},
        {cat_no: 58, name: 'Wallets'},
        {cat_no: 66, name: 'Kimono'}
      ]
    }
  ];

  var PROMPT_EDIT_STEPS = [
    {
      id: 'C0',
      title: 'C0: 検証 (read-only fact gathering)',
      owner: 'child-b (または空いている child)',
      duration: '10–15 分',
      artifact: 'reports/child-b-&lt;cat&gt;-v10-C0.json',
      notify: 'DONE:&lt;cat&gt;-v10-C0',
      what: [
        'V10 基準ファイル (存在する場合) の sha256 / 行数実測',
        '現行 <code>prompts/&lt;cat&gt;.txt</code> の sha256 / 行数実測',
        '両者 diff 行数: <code>diff ...V10.txt prompts/&lt;cat&gt;.txt | wc -l</code>',
        '<code>Library/PromptTemplates.gs</code> 現状: 対象カテゴリ version + 他カテゴリ version (汚染チェック)',
        '<code>git status -s</code> / <code>git log -5 --oneline</code>',
        'working tree dirty files 全列挙 (modified / deleted / untracked)',
        '<code>sync_prompts_to_gs.py</code> docstring 確認 + 推奨 dry-run コマンド',
        '復元戦略 (Option G / Option B) 実行可能性 Fact 分析'
      ],
      conditions: [
        '上記 8 項目すべて実測値で記録済み',
        '推測なし、Fact / Inference / Unknown 明記',
        'ファイル編集・git 操作・sync 実行なし (read-only)'
      ],
      forbidden: 'ファイル編集、git 操作、sync 実行'
    },
    {
      id: 'C0.5',
      title: 'C0.5: 原則適合性チェック (Part A + Part B)',
      owner: 'child-b または parent 自律',
      duration: '15–20 分',
      artifact: 'reports/child-&lt;X&gt;-&lt;cat&gt;-principles-check.json',
      notify: 'DONE:&lt;cat&gt;-principles-check',
      what: [
        '<strong>【Part A: 削る — 8 原則違反列挙】</strong>',
        '<strong>P1</strong> 行数チェック: <code>wc -l prompts/&lt;cat&gt;.txt</code> → 100-130 超えで P1 違反',
        '<strong>P2</strong> Translation Dictionary 有無: セクション存在で P2 違反 (削除推奨)',
        '<strong>P3</strong> ABSOLUTE RULES 多段化: Category A/B/C 等のネスト構造で P3 違反',
        '<strong>P4</strong> Few-shot Example 偏り分析: 特定パターンに偏った例が 1 件以上で P4 リスク',
        '<strong>P5</strong> 多段 note 検査: <code>Note:</code> が 2 個以上で P5 違反',
        '<strong>P6</strong> 文字数レンジ幅測定: 幅が 10 字超えで P6 違反',
        '<strong>P7</strong> VERIFICATION 項目数カウント: 13 超えで P7 違反',
        '<strong>P8</strong> 固定値注入の有無: Country of Origin / Made in Japan ルールのハードコードで P8 違反',
        '<strong>【Part B: 追加 — 基盤機能欠落列挙 (v2.0 新規)】</strong>',
        '<strong>M-1</strong> GOALS 4 原則 存在確認: Japanese→English / ASCII only / no verbatim / no hallucination',
        '<strong>M-2</strong> DEFECT/ISSUE REPORTING 存在確認: CRITICAL ヘッダー + カテゴリ固有 JP→EN 3 件以上 + "Omitting known defects is a violation of eBay policy." 完全一致',
        '<strong>M-3</strong> OUTPUT_FORMAT 4 フィールド 存在確認',
        '<strong>M-4</strong> VERIFICATION 最低構造: items 1-5 + defect check + source-only check',
        '<strong>M-5</strong> <code>Input: ${fullText}</code> 最終行 存在確認',
        '<strong>M-6</strong> AUTHENTIC/OFFICIAL BAN ルール 存在確認',
        '違反リスト (Part A) + 欠落リスト (Part B) をまとめた JSON を出力'
      ],
      conditions: [
        '8 原則すべてに対してチェック済み (Pass / Fail / N/A を明記)',
        '基盤機能 M-1〜M-6 全て確認済み (存在 / 欠落 を明記)',
        '違反・欠落があれば C1 Sprint Contract の §BASELINE に反映',
        'V10 ベース復元 (sha256 一致) の場合: Part A 省略可、Part B は必ず実施'
      ],
      forbidden: 'ファイル編集、git 操作',
      warning: '⚠️ Part B (基盤機能欠落確認) は V10 復元時も省略禁止。石鹸・一般商品の DEFECT 欠落事件の教訓。'
    },
    {
      id: 'C1',
      title: 'C1: Sprint Contract 作成',
      owner: 'parent (自律)',
      duration: '15–20 分',
      artifact: 'contracts/&lt;CAT&gt;-V10-&lt;ACTION&gt;.md',
      notify: '(parent 内部作業、通知なし)',
      what: [
        '目的: 1–2 行で明記',
        '背景 (Fact): sha256・行数・テスト結果など数値を記載',
        '戦略: Option G vs B 比較表 + 採用理由',
        '成功条件 8 項目 (sha256 / 行数 / Library version / 他カテゴリ保護 / 2 ファイルのみ / dirty 保持 / push 完了 / 実データ検証)',
        'プロセス要件チェックリスト (推測禁止 / sha256 実測 / <code>git add -A</code> 禁止 / cp 方式 / dry-run 先行 / staged 検証)',
        '変更しない箇所の明示リスト',
        'commit message 案 (HEREDOC で渡せる完成形)',
        'Known Tradeoffs (改訂で失われる機能の承認済みリスト)',
        'E-02 検証項目 (C5 でチェックする grep/diff/sha256 項目)',
        '担当割り当て表',
        '<strong>【§BASELINE 準拠チェックリスト (v2.0 必須)】</strong>',
        '□ M-1 GOALS 4 原則: 存在 / 追加',
        '□ M-2 DEFECT/ISSUE REPORTING: 存在 / 追加 (カテゴリ固有 JP→EN 3 件以上 + "Omitting known defects is a violation of eBay policy." 完全一致文言)',
        '□ M-3 OUTPUT_FORMAT 4 フィールド: 存在 / 追加',
        '□ M-4 VERIFICATION 13 項目 (最低 items 1-5 + defect check): 存在 / 追加',
        '□ M-5 <code>${fullText}</code>: 存在 / 追加',
        '□ M-6 AUTHENTIC/OFFICIAL BAN: 存在 / 追加',
        '□ 11 セクション順序 V10 一致'
      ],
      conditions: [
        'ユーザー承認済みであること (承認前に child に渡さない)',
        '曖昧な要件なし (全て Fact ベース)',
        '§BASELINE チェックリスト全 7 項目が「存在 / 追加 / 不要理由明記」のいずれかで埋まっていること',
        '「もしあれば保持」等の条件付き保持表現 (LL-3) が一切ないこと — 必須追加 / 不要理由明記の二択のみ'
      ],
      forbidden: 'ユーザー承認前に child に渡すこと / プロセス要件を曖昧なままにすること / §BASELINE を省略すること'
    },
    {
      id: 'C1.5',
      title: 'C1.5: 設計書メタレビュー (v2.0 新規)',
      owner: 'child-c (検察官ペルソナ)',
      duration: '10–15 分',
      artifact: 'reports/child-c-&lt;cat&gt;-C1.5.json',
      notify: 'DONE:&lt;cat&gt;-C1.5',
      what: [
        'Sprint Contract 自体の構造と内容を検察官ペルソナでレビュー (実装前に設計書の誤りを捕捉)',
        '§BASELINE セクションが M-1〜M-6 全 6 項目を網羅しているか確認',
        '11 セクション順序の指定が明確か確認 (IDENTITY→GOALS→TITLE→...→INPUT)',
        '「もしあれば保持」「存在する場合は保持」「あれば」「必要に応じて」等の条件付き保持表現 (LL-3) がないか確認',
        '「存在 / 追加 / 不要理由明記」の二択のみであることを確認',
        'M-2 DEFECT/ISSUE REPORTING: カテゴリ固有 JP→EN 3 件以上 + "Omitting known defects is a violation of eBay policy." 完全一致文言の要求が明記されているか',
        'M-6 AUTHENTIC/OFFICIAL BAN の要求が明記されているか',
        'C5 F-2 向けの grep 指示が含まれているか'
      ],
      conditions: [
        'PASS: 全項目クリア → C2 設計レビューに進む',
        'FAIL: Sprint Contract を parent に差し戻し (C1 再作成)'
      ],
      forbidden: 'Sprint Contract の修正 (指摘のみ、修正は parent 担当)'
    },
    {
      id: 'C2',
      title: 'C2: E-02 設計レビュー',
      owner: 'child-c (E-02 専任・検察官ペルソナ)',
      duration: '15–20 分',
      artifact: 'reports/child-c-&lt;cat&gt;-v10-C2.json',
      notify: 'DONE:&lt;cat&gt;-v10-C2',
      what: [
        'A: 成功条件の妥当性 (測定可能か・不足ないか)',
        'B: プロセス要件の十分性',
        'C: 戦略 (Option G vs B) 選択根拠',
        'D: commit message の Fact 整合 (数値の誤帰属なし)',
        'E: V10 (または改訂後プロンプト) の内容品質 — ① 11 セクション構造 (IDENTITY/GOALS/TITLE/SEO_ORDER/CATEGORY_RULE/DESCRIPTION/PRODUCTNAME/CATEGORY/OUTPUT_FORMAT/VERIFICATION/INPUT) ② §BASELINE 全 6 項目 (M-1〜M-6) 満たすか ③ GOALS / TITLE / VERIFICATION / OUTPUT_FORMAT / <code>${fullText}</code> 内容確認',
        'F: 現行 vs V10 差分リスク (削除される機能の評価)',
        'G: Library/PromptTemplates.gs 同期影響 (他カテゴリ保持)',
        'H: Feature.json 更新計画'
      ],
      conditions: [
        'PASS: Critical/High/Medium ゼロ → proceed_to_c4',
        'CONDITIONAL_PASS: Medium あり → C3 修正後に C4 進行',
        'FAIL: 設計戻し'
      ],
      forbidden: 'コード修正 (レビューのみ)'
    },
    {
      id: 'C3',
      title: 'C3: 設計修正',
      owner: 'parent (自律)',
      duration: '5–10 分',
      artifact: 'contracts/&lt;CAT&gt;-V10-&lt;ACTION&gt;.md (更新)',
      notify: '(parent 内部作業、通知なし)',
      what: [
        'C2 の Medium 以上指摘を Sprint Contract に Edit で反映',
        'Low 指摘は必要に応じて反映、または将来 V11 策定時検討として記録',
        '修正完了後、ユーザーに再確認を求める (重大な変更がある場合)'
      ],
      conditions: [
        'C2 の Medium 以上指摘が全て解消されていること'
      ],
      forbidden: 'ファイル実装・git 操作'
    },
    {
      id: 'C4',
      title: 'C4: 実装',
      owner: 'child-a (または指定 child)',
      duration: '10–15 分',
      artifact: 'reports/child-a-&lt;cat&gt;-v10-C4.json',
      notify: 'DONE:&lt;cat&gt;-v10-C4',
      what: [
        '<strong>Step 1</strong> 事前 Fact 確認: sha256 (V10 基準 / 現行 prompts / Library) + git status + git log',
        '<strong>Step 2</strong> <code>git restore Library/PromptTemplates.gs</code> で HEAD に戻す (Option G)',
        '<strong>Step 3</strong> 他 working tree dirty files が M のまま保持されているか確認',
        '<strong>Step 4</strong> <code>cp &lt;V10ファイル&gt; prompts/&lt;cat&gt;.txt</code> でバイト完全コピー (Write ツール trailing newline 対策)',
        '<code>shasum -a 256 prompts/&lt;cat&gt;.txt</code> → V10 sha と完全一致確認',
        '<strong>Step 5</strong> <code>python3 Library/sync_prompts_to_gs.py &lt;cat&gt; --dry-run</code> 出力を報告 JSON に記録',
        '<strong>Step 6</strong> <code>python3 Library/sync_prompts_to_gs.py &lt;cat&gt;</code> 本番実行',
        '<strong>Step 7</strong> 最終 Fact 確認: sha256 両ファイル + Library version + git status + git diff --stat'
      ],
      conditions: [
        '<code>prompts/&lt;cat&gt;.txt</code> sha256 が V10 と完全一致',
        '行数が V10 と一致',
        'Library の対象カテゴリ version がインクリメント済み',
        '他カテゴリの Library version が HEAD と一致 (汚染なし)',
        'git diff --stat が 2 ファイルのみ'
      ],
      forbidden: 'git add / git commit / git push / clasp push / git add -A',
      warning: '⚠️ Write ツールは末尾改行を付加するため sha256 ずれる。必ず <code>cp</code> コマンドでバイト完全コピーすること。'
    },
    {
      id: 'C5',
      title: 'C5: E-02 実装レビュー',
      owner: 'child-c (E-02 専任・検察官ペルソナ)',
      duration: '15 分以内',
      artifact: 'reports/child-c-&lt;cat&gt;-v10-C5.json',
      notify: 'DONE:&lt;cat&gt;-v10-C5',
      what: [
        'A: sha256 完全一致 (<code>diff</code> 実機確認で差分ゼロ)',
        'B: 行数',
        'C: Library カテゴリ version (期待値と一致) + 他カテゴリ pre-existing 汚染なし',
        'D: Library content が V10 と整合 (git diff HEAD 目視)',
        'E: git diff 2 ファイルのみ変更',
        '<strong>F-1:</strong> Sprint Contract 記載 保持必須 (SC の成功条件と照合)',
        '<strong>F-2:</strong> WORKFLOW v2.0 第 2 章 基盤機能リスト 全 6 項目を grep で<em>独立</em>確認 (Sprint Contract 外でも必須)',
        '<code>grep -c "DEFECT/ISSUE REPORTING" prompts/&lt;cat&gt;.txt</code>  # ≥1',
        '<code>grep -c "Omitting known defects is a violation of eBay policy" prompts/&lt;cat&gt;.txt</code>  # ==1',
        '<code>grep -c "Input: \\${fullText}" prompts/&lt;cat&gt;.txt</code>  # ==1',
        '<code>grep -c "AUTHENTIC\\|OFFICIAL" prompts/&lt;cat&gt;.txt</code>  # ≥1 (BAN ルール)',
        'G: 他 working tree dirty preserved',
        'H: ゴルフ (または他非対象カテゴリ) の Library 行が HEAD と一致',
        'I: C4 report の Fact 整合'
      ],
      conditions: [
        'PASS + <code>approval_decision_for_c6: APPROVED_PER_MANAGER_POLICY</code> → C6 進行',
        'BLOCKED → parent に ISSUE 通知、C4 差し戻し'
      ],
      forbidden: 'コード修正 (レビューのみ) / PASS 条件の恣意的な緩和'
    },
    {
      id: 'C5.5',
      title: 'C5.5: Phase 内 QA Checkpoint (v2.0 新規)',
      owner: 'child-a (または parent)',
      duration: '10–15 分',
      artifact: 'reports/child-a-phase-qa-checkpoint.json',
      notify: 'DONE:phase-qa-checkpoint',
      what: [
        '3–4 カテゴリ完了時点で meta-review を実施',
        '各カテゴリのレビュー結果を横断比較: 判定基準にドリフトが生じていないか確認',
        '基盤機能 M-1〜M-6 の判定基準が一貫しているか再確認',
        '「Medium 以上を残したまま PASS 判定」が発生していないか確認',
        '11 セクション順序チェックの徹底度が一貫しているか確認',
        'ドリフト検知時: 親に ISSUE 報告 → 次カテゴリ着手前に基準再確認',
        '問題なければ DONE 通知して次カテゴリへ'
      ],
      conditions: [
        '基準ドリフトなし (または検知・修正済み)',
        '次カテゴリ着手前に親が承認'
      ],
      forbidden: 'ドリフトを無視して次カテゴリへ進むこと'
    },
    {
      id: 'C6',
      title: 'C6: git push + clasp push',
      owner: 'child-a (C4 担当と同じ child を推奨)',
      duration: '5–10 分',
      artifact: 'reports/child-a-&lt;cat&gt;-v10-C6.json',
      notify: 'PROGRESS 3 回 (commit/push/clasp) + DONE:&lt;cat&gt;-v10-C6:&lt;hash&gt;',
      what: [
        '<strong>Step 1</strong> 事前確認: sha256 / git status / git log',
        '<strong>Step 2</strong> <code>git add prompts/&lt;cat&gt;.txt Library/PromptTemplates.gs</code> (2 ファイルのみ) → <code>git diff --staged --stat</code> で 2 files 確認',
        '<strong>Step 3–4</strong> <code>git commit -m "$(cat &lt;&lt;\'MSG_EOF\'\\n...\\nMSG_EOF\\n)"</code> (Sprint Contract の HEREDOC message) → <code>git log -1 --stat</code>',
        '進捗通知: <code>PROGRESS:&lt;cat&gt;-v10-commit-done:&lt;hash&gt;</code>',
        '<strong>Step 5</strong> <code>git push</code> → 進捗通知: <code>PROGRESS:&lt;cat&gt;-v10-git-pushed</code>',
        '<strong>Step 6</strong> <code>cd Library &amp;&amp; npx clasp push</code> (PATH に clasp がない場合は <code>npx clasp</code>) → 失敗時のみ <code>--force</code> 再試行 → 進捗通知: <code>PROGRESS:&lt;cat&gt;-v10-clasp-pushed</code>',
        '<strong>Step 7</strong> Discord 通知: <code>~/.claude/scripts/notify-discord.sh "&lt;cat&gt; V10 復元 push 完了"</code>',
        '<strong>Step 8</strong> 完了通知: <code>DONE:&lt;cat&gt;-v10-C6:&lt;hash&gt;</code>'
      ],
      conditions: [
        'git push 成功 (push --force 絶対禁止)',
        'clasp push 成功 (24 ファイル push 確認)',
        'Discord 通知送信済み'
      ],
      forbidden: 'ファイル編集 / git add -A / git push --force / --no-verify / 時計用・Library 以外への git add'
    },
    {
      id: 'POST',
      title: '後処理 (parent 自律)',
      owner: 'parent',
      duration: '5–10 分',
      artifact: 'docs/feature.json (更新)',
      notify: 'ユーザーへ最終報告',
      what: [
        '<strong>Feature.json 更新</strong> (parent のみ権限、child は触らない):',
        '旧 Feature: <code>F-&lt;cat&gt;-old-approach</code> → <code>skipped</code> (放棄理由記載)',
        '新 Feature: <code>F-&lt;cat&gt;-restore-v10</code> → <code>passing</code> (commit hash / C0-C6 経緯)',
        'Obsidian / HANDOVER.md 追記 (別 child に委託可)',
        '椛島さんへ最終報告 (C6 DONE 受領直後)'
      ],
      conditions: [
        'Feature.json 更新済み (parent のみ)',
        'Obsidian ノート追記済み',
        '椛島さんへの最終報告完了'
      ],
      forbidden: 'child による Feature.json 直接更新'
    }
  ];

  var OPTION_COMPARISON = [
    { axis: 'commit 対象の純粋性', g: '高 (対象カテゴリのみ)', b: '中 (他カテゴリ uncommitted と混在)' },
    { axis: '非対象カテゴリ working tree', g: '<strong>消失</strong> (halt 許容時のみ採用)', b: '保持' },
    { axis: '操作複雑性', g: '低 (restore 1 回)', b: '高 (<code>git add -p</code> 対話必要)' },
    { axis: 'ミス混入余地', g: '小', b: '中 (hunk 選別ミス)' },
    { axis: '後工程', g: '他カテゴリ sync 再実行', b: 'なし' },
    { axis: '推奨シナリオ', g: '他カテゴリ作業 halt 中', b: '他カテゴリ作業保持必須' }
  ];

  var FAILURE_PATTERNS = [
    { failure: 'Library が他カテゴリ uncommitted で汚染される', cause: 'sync 前に working tree dirty 確認なし', fix: 'C0 で必ず Library 全カテゴリ version を列挙' },
    { failure: 'sha256 不一致', cause: 'Write ツール trailing newline 付加', fix: '<code>cp</code> 方式でバイト完全コピー' },
    { failure: 'commit に無関係ファイル混入', cause: '<code>git add -A</code> / <code>git add .</code>', fix: '<strong>特定ファイル名指定のみ</strong>' },
    { failure: 'clasp push 失敗', cause: 'clasp が PATH にない', fix: '<code>npx clasp push</code> を使用' },
    { failure: 'E-02 が grep 一致のみで PASS 判定', cause: '実データテストなし', fix: 'V10 ベース復元なら grep 一致で OK。新規設計なら椛島さん実データテスト必須' },
    { failure: 'Enter が効かず通知が届かない', cause: '<code>tmux send-keys "..." Enter</code> が submit として認識されない', fix: '案 3 パターン (load-buffer + paste-buffer + 独立 Enter) を使用' }
  ];

  function buildPromptEditStepCard(step) {
    var whatItems = step.what.map(function (item) {
      return '<li class="step-card__list-item">' + item + '</li>';
    }).join('');

    var condItems = step.conditions.map(function (item) {
      return '<li class="step-card__list-item step-card__list-item--check">' + item + '</li>';
    }).join('');

    var metaHtml = '<div class="step-card__section" style="background:#f8fafc;border-radius:4px;padding:8px 12px;margin-bottom:8px;">' +
      '<span style="margin-right:16px;">👤 <strong>' + step.owner + '</strong></span>' +
      '<span style="margin-right:16px;">⏱ ' + step.duration + '</span>' +
      '<span>📄 <code>' + step.artifact + '</code></span>' +
    '</div>';

    var notifyHtml = '<div class="step-card__section step-card__section--files">' +
      '<h4 class="step-card__section-title">📡 完了通知</h4>' +
      '<code class="step-card__file">' + step.notify + '</code>' +
    '</div>';

    var forbiddenHtml = step.forbidden
      ? '<div class="step-card__warning">🚫 禁止: ' + step.forbidden + '</div>'
      : '';

    var warningHtml = step.warning
      ? '<div class="step-card__warning">' + step.warning + '</div>'
      : '';

    return '<div class="step-card" id="pe-step-' + step.id + '">' +
      '<div class="step-card__header">' +
        '<span class="step-card__badge">' + esc(step.id) + '</span>' +
        '<span class="step-card__title">' + esc(step.title) + '</span>' +
        '<span class="step-card__chevron">▾</span>' +
      '</div>' +
      '<div class="step-card__body">' +
        metaHtml +
        (warningHtml || '') +
        (forbiddenHtml || '') +
        '<div class="step-card__section">' +
          '<h4 class="step-card__section-title">何をする</h4>' +
          '<ul class="step-card__list">' + whatItems + '</ul>' +
        '</div>' +
        '<div class="step-card__section">' +
          '<h4 class="step-card__section-title">✅ 完了条件・判定</h4>' +
          '<ul class="step-card__list">' + condItems + '</ul>' +
        '</div>' +
        notifyHtml +
      '</div>' +
    '</div>';
  }

  function renderPromptEdit() {
    var container = el('prompt-edit-container');
    if (!container) return;

    var introHtml = '<div class="workflow-intro">' +
      '<div class="workflow-intro__status" style="background:#dbeafe;border:1px solid #93c5fd;border-radius:6px;padding:10px 16px;margin-bottom:12px;">' +
        '<strong>📝 プロンプト編集ワークフロー v2.0</strong> — 石鹸・一般商品 DEFECT 欠落判明後の抜本改訂。3 本柱: ① 11 セクション構造テンプレート ② 基盤機能リスト M-1〜M-6 ③ 削る 8 原則。' +
      '</div>' +
      '<div class="workflow-intro__next" style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:10px 16px;margin-bottom:12px;">' +
        '<strong>運用原則 (v2.0):</strong><br>' +
        '① 1 カテゴリずつ進める (複数同時禁止)<br>' +
        '② E-02 独立レビュワー = child-c 固定 (Gemini/Codex は不安定で禁止)<br>' +
        '③ Sprint Contract なしで child に作業を渡さない<br>' +
        '④ 実データテストを挟んでから次カテゴリ開始<br>' +
        '⑤ 親は設計・判断・レビュー参加のみ。実作業は child 委託<br>' +
        '⑥ 「Medium 以上の指摘残存」で PASS 判定しない<br>' +
        '⑦ 「もしあれば保持」という条件付き保持表現は禁止 (LL-3) — 必須 / 不要の二択のみ<br>' +
        '⑧ Phase 内 QA Checkpoint (C5.5) — 3–4 本完了時点で meta-review、基準ドリフト検知' +
      '</div>' +
      '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:10px 16px;margin-bottom:16px;">' +
        '<strong>パイプライン全体図 (v2.0):</strong>' +
        '<pre style="margin:8px 0 0;font-size:12px;line-height:1.6;">' +
          'C0   検証 (child-b)              読取専用、sha256/git status/差分確認\n' +
          '   ↓\n' +
          'C0.5 原則適合性チェック (A+B)     Part A: 8 原則違反 / Part B: 基盤機能欠落 (v2.0 新規)\n' +
          '   ↓\n' +
          'C1   Sprint Contract (parent)    §BASELINE チェックリスト M-1〜M-6 必須 (v2.0 新規)\n' +
          '   ↓\n' +
          'C1.5 設計書メタレビュー (child-c) §BASELINE 網羅・LL-3 禁止・11 セクション確認 (v2.0 新規)\n' +
          '   ↓\n' +
          'C2   E-02 設計レビュー (child-c) 観測点 E: 11 セクション + §BASELINE チェック追加 (v2.0 強化)\n' +
          '   ↓\n' +
          'C3   設計修正 (parent)           C2 指摘反映\n' +
          '   ↓\n' +
          'C4   実装 (child-a)              Read → cp → sync_prompts_to_gs.py\n' +
          '   ↓\n' +
          'C5   E-02 実装レビュー (child-c) F-1: SC 保持 / F-2: 基盤機能 grep 独立確認 (v2.0 強化)\n' +
          '   ↓ [PASS = C6 push 承認済み]\n' +
          'C5.5 Phase 内 QA Checkpoint      3–4 本完了時点 meta-review、基準ドリフト検知 (v2.0 新規)\n' +
          '   ↓\n' +
          'C6   push (child-a)              git add/commit/push + npx clasp push + Discord\n' +
          '   ↓\n' +
          '後処理 (parent)                  Feature.json 更新 / Obsidian / 椛島さん最終報告' +
        '</pre>' +
      '</div>' +
      '<div class="workflow-intro__legend">' +
        '<span class="workflow-legend-item"><span class="step-card__badge step-card__badge--sm">CX</span> ステップ ID</span>' +
        '<span class="workflow-legend-item">🚫 禁止事項あり</span>' +
        '<span class="workflow-legend-item">⚠️ 注意事項あり</span>' +
        '<span class="workflow-legend-item">ヘッダクリックで折りたたみ</span>' +
      '</div>' +
    '</div>';

    /* 8 Principles table */
    var principleRows = PROMPT_PRINCIPLES.map(function (p) {
      return '<tr><td style="text-align:center;font-weight:700;">P' + p.num + '</td>' +
        '<td>' + p.rule + '</td>' +
        '<td><code>' + p.violation + '</code></td>' +
        '<td><span style="color:#dc2626;">' + p.impact + '</span></td></tr>';
    }).join('');

    var principlesHtml = '<div class="design-section" id="pe-principles">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">⭐ 良いプロンプトの 8 原則 (時計 V10 検証で発見)</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">時計プロンプト V49/V50/V51 が実データテストで失敗し、V10 (107 行) が圧勝した経験から抽出。' +
        'プロンプト改修・新規作成前に <strong>C0.5 原則適合性チェック</strong> でこれらを確認すること。</p>' +
        '<table class="design-table">' +
          '<thead><tr><th>#</th><th>原則</th><th>違反例</th><th>影響</th></tr></thead>' +
          '<tbody>' + principleRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* 11-Section Template table */
    var sectionRows = SECTION_TEMPLATE.map(function (s) {
      return '<tr><td style="text-align:center;font-weight:700;">' + s.num + '</td>' +
        '<td><strong>' + s.name + '</strong></td>' +
        '<td>' + s.lines + '</td>' +
        '<td>' + s.desc + '</td></tr>';
    }).join('');

    var sectionTemplateHtml = '<div class="design-section" id="pe-section-template">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">📐 第 1 章: V10 構造テンプレート — 11 セクション (MANDATORY BASELINE)</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">全カテゴリは時計 V10 と同じ 11 セクション構造を持つ。AI が上から処理する特性に最適化済み。<strong>順序変更禁止。</strong>' +
        ' 行数目標: 標準 100-130 行 / DEFECT+MISSING フル装備 120-140 行 / シンプルカテゴリ (石鹸等) 90-110 行。</p>' +
        '<table class="design-table">' +
          '<thead><tr><th>#</th><th>セクション名</th><th>行数目安</th><th>内容</th></tr></thead>' +
          '<tbody>' + sectionRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* Baseline Functions table */
    var baselineRows = BASELINE_FUNCTIONS.map(function (m) {
      var policyBadge = m.ebay_policy
        ? ' <span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:3px;padding:1px 5px;font-size:11px;">eBay policy</span>'
        : '';
      return '<tr><td style="text-align:center;font-weight:700;">' + m.id + '</td>' +
        '<td><strong>' + m.title + '</strong>' + policyBadge + '</td>' +
        '<td>' + m.detail + '</td></tr>';
    }).join('');

    var baselineFunctionsHtml = '<div class="design-section" id="pe-baseline-functions">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">🛡️ 第 2 章: 基盤機能リスト M-1〜M-6 (MANDATORY — 全カテゴリ必須)</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">eBay policy 義務 + 出力品質担保のため全カテゴリに必須。C0.5 Part B で欠落を確認し、Sprint Contract の §BASELINE で追加を明記する。' +
        ' <strong>石鹸・一般商品の DEFECT 欠落事件の教訓。</strong></p>' +
        '<table class="design-table">' +
          '<thead><tr><th>ID</th><th>機能名</th><th>詳細要件</th></tr></thead>' +
          '<tbody>' + baselineRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* Reference Implementations */
    var refCards = REFERENCE_IMPLEMENTATIONS.map(function (r) {
      var statusCls = r.status === 'READY' ? 'color:#16a34a;' : r.status === 'NEEDS_VERIFICATION' ? 'color:#d97706;' : 'color:#6b7280;';
      var commitInfo = r.commit ? ' <code style="font-size:11px;">' + r.commit + '</code>' : '';
      var linesInfo = r.lines ? ' ' + r.lines + ' 行' : '';
      return '<div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">' +
          '<strong>' + r.label + '</strong>' +
          '<span style="' + statusCls + 'font-size:12px;font-weight:600;">[' + r.status + ']</span>' +
          (r.file ? '<code style="font-size:11px;color:#6b7280;">' + r.file + linesInfo + '</code>' : '') +
          commitInfo +
        '</div>' +
        '<div style="font-size:13px;color:#374151;">' + r.description + '</div>' +
        '<div style="font-size:12px;color:#6b7280;margin-top:4px;">用途: ' + r.purpose + '</div>' +
      '</div>';
    }).join('');

    var referenceHtml = '<div class="design-section" id="pe-reference-impl">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">📎 第 3.5 章: Reference Implementations (判例集)</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">' +
          '新カテゴリ改修時は最も近い類型の Reference をコピーして <strong>差し替え 10 項目のみ編集</strong>する。' +
          '"その都度ゼロから考える" 設計を廃止し、74 カテゴリ品質均質化を図る。' +
        '</p>' +
        refCards +
      '</div>' +
    '</div>';

    /* Substitution Items table */
    var substRows = SUBSTITUTION_ITEMS.map(function (s) {
      return '<tr><td style="text-align:center;">' + s.num + '</td>' +
        '<td>' + s.item + '</td>' +
        '<td><code style="font-size:11px;">' + s.reel_example + '</code></td>' +
        '<td>' + s.policy + '</td></tr>';
    }).join('');

    var substitutionHtml = '<div class="design-section" id="pe-substitution">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">🔧 差し替え項目チェックリスト (リール V2.0 → 新カテゴリ)</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">' +
          '<strong>共通部分 (変更禁止):</strong> GOALS 4 原則の 3 原則 (L4-L6) / TITLE rule 共通部 / Rule 2 標準文言 / DEFECT header+intro+eBay policy 文言 / OUTPUT_FORMAT / VERIFICATION items 1-5 / <code>Input: ${fullText}</code>' +
        '</p>' +
        '<table class="design-table">' +
          '<thead><tr><th>#</th><th>差し替え項目</th><th>リール V2.0 記述例</th><th>差し替え方針</th></tr></thead>' +
          '<tbody>' + substRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* Category Type Map */
    var typeSections = CATEGORY_TYPE_MAP.map(function (t) {
      var catList = t.categories.map(function (c) {
        return '<span style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:3px;padding:1px 6px;margin:2px;font-size:12px;">Cat ' + String(c.cat_no).padStart(2, '0') + ' ' + c.name + '</span>';
      }).join('');
      var refStatusCls = t.reference.indexOf('READY') !== -1 ? '#16a34a' : t.reference.indexOf('NEEDS') !== -1 ? '#d97706' : '#6b7280';
      return '<div style="margin-bottom:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:6px;">' +
        '<div style="margin-bottom:6px;">' +
          '<strong>類型 ' + t.type_id + ': ' + t.type_name + '</strong>' +
          ' <span style="color:#6b7280;font-size:12px;">(' + t.categories.length + ' カテゴリ)</span>' +
          ' <span style="color:' + refStatusCls + ';font-size:12px;margin-left:8px;">▶ ' + t.reference + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#64748b;margin-bottom:6px;">' + t.description + '</div>' +
        '<div>' + catList + '</div>' +
      '</div>';
    }).join('');

    var categoryTypeHtml = '<div class="design-section" id="pe-category-types">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">🗂️ 第 7.5 章: 74 カテゴリ × 5 商品タイプ分類</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<p class="design-note" style="margin-bottom:8px;">各カテゴリを 5 類型に分類し、最適な Reference Implementation を割り当てる。改修前に自カテゴリの類型を確認し、対応 Reference をコピーして着手すること。</p>' +
        typeSections +
      '</div>' +
    '</div>';

    var stepsHtml = baselineFunctionsHtml + referenceHtml + substitutionHtml + categoryTypeHtml + sectionTemplateHtml + principlesHtml + PROMPT_EDIT_STEPS.map(buildPromptEditStepCard).join('');

    /* Option G vs B comparison table */
    var optionRows = OPTION_COMPARISON.map(function (row) {
      return '<tr><td>' + row.axis + '</td><td>' + row.g + '</td><td>' + row.b + '</td></tr>';
    }).join('');

    var optionHtml = '<div class="design-section" id="pe-option-compare">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">戦略比較: Option G vs Option B</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<table class="design-table">' +
          '<thead><tr><th>比較軸</th><th>Option G (git restore + sync)</th><th>Option B (sync のみ)</th></tr></thead>' +
          '<tbody>' + optionRows + '</tbody>' +
        '</table>' +
        '<p class="design-note" style="margin-top:8px;"><strong>Option G 採用条件:</strong> 他カテゴリ作業が halt 中。commit 純粋性を重視。<br><strong>Option B 採用条件:</strong> 他カテゴリの working tree change を保持しなければならない場合。</p>' +
      '</div>' +
    '</div>';

    /* Failure patterns table */
    var failureRows = FAILURE_PATTERNS.map(function (row) {
      return '<tr><td>' + row.failure + '</td><td>' + row.cause + '</td><td>' + row.fix + '</td></tr>';
    }).join('');

    var failureHtml = '<div class="design-section" id="pe-failure-patterns">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">失敗パターンと回避策</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<table class="design-table">' +
          '<thead><tr><th>失敗</th><th>原因</th><th>回避策</th></tr></thead>' +
          '<tbody>' + failureRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* Category notes */
    var categoryHtml = '<div class="design-section" id="pe-category-notes">' +
      '<div class="design-section__header">' +
        '<span class="design-section__chevron">▾</span>' +
        '<h3 class="design-section__title">カテゴリ別特記事項</h3>' +
      '</div>' +
      '<div class="design-section__body">' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">ゴルフ (halt 中)</h4>' +
          '<ul class="design-ul">' +
            '<li>現状: <code>prompts/ゴルフ.txt</code> (M 保持中)、Library ゴルフ v46 (HEAD)</li>' +
            '<li>halt 解除後に <code>python3 Library/sync_prompts_to_gs.py ゴルフ</code> で v47 相当復活可能</li>' +
            '<li>時計 544d7c8 完了済みのため、次回再開時は Option G 不要 (ゴルフ単体で Option B でも可)</li>' +
          '</ul>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">カメラ / リール (未着手)</h4>' +
          '<ul class="design-ul">' +
            '<li>椛島さんの手元に V10 相当基準プロンプトがあるか C0 で確認</li>' +
            '<li>なければ時計 V10 を参考に新規ベース作成 → 椛島さん合意 → 実装</li>' +
          '</ul>' +
        '</div>' +
        '<div class="design-subsection">' +
          '<h4 class="design-subsection__title">通信プロトコル (§P-3 確実送信パターン)</h4>' +
          '<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">echo "&lt;MSG&gt;" | tmux load-buffer -\ntmux paste-buffer -t &lt;parent_session&gt;:main.0\nsleep 0.3\ntmux send-keys -t &lt;parent_session&gt;:main.0 Enter</pre>' +
          '<p class="design-note">⚠️ <code>tmux send-keys "..." Enter</code> では Enter が submit として認識されない場合あり。上記の load-buffer + paste-buffer + Enter 分離パターンが確実。</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    container.innerHTML = introHtml + stepsHtml + optionHtml + failureHtml + categoryHtml;

    /* Bind step collapse toggles */
    var stepHeaders = container.querySelectorAll('.step-card__header');
    stepHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        header.parentElement.classList.toggle('step-card--collapsed');
      });
    });

    /* Bind design section collapse toggles */
    var sectionHeaders = container.querySelectorAll('.design-section__header');
    sectionHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        header.parentElement.classList.toggle('design-section--collapsed');
      });
    });
  }

  /* ----------------------------------------------------------
     Session Guide Copy
  ---------------------------------------------------------- */
  window.copySessionGuide = function () {
    var textEl = document.getElementById('session-guide-text');
    var feedbackEl = document.getElementById('session-guide-copy-feedback');
    if (!textEl) return;
    var text = textEl.textContent || textEl.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        feedbackEl.textContent = '✅ コピーしました';
        setTimeout(function () { feedbackEl.textContent = ''; }, 2000);
      }).catch(function () {
        fallbackCopy(text, feedbackEl);
      });
    } else {
      fallbackCopy(text, feedbackEl);
    }
  };

  function fallbackCopy(text, feedbackEl) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      feedbackEl.textContent = '✅ コピーしました';
    } catch (e) {
      feedbackEl.textContent = '❌ コピー失敗';
    }
    document.body.removeChild(ta);
    setTimeout(function () { feedbackEl.textContent = ''; }, 2000);
  }

  /* ----------------------------------------------------------
     Error Banner
  ---------------------------------------------------------- */
  function showErrorBanner(msg) {
    var banner = document.createElement('div');
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'background:#dc2626', 'color:#fff',
      'padding:14px 24px', 'font-size:14px',
      'z-index:9999', 'font-weight:700'
    ].join(';');
    banner.textContent = '⚠️ ' + msg;
    document.body.prepend(banner);
  }

  /* ----------------------------------------------------------
     Init
  ---------------------------------------------------------- */
  function init() {
    /* Tab, Workflow & Design are static — run regardless of data.js */
    initTabs();
    renderWorkflow();
    renderDesign();
    renderPromptEdit();

    /* Check data.js loaded */
    if (typeof window.PROGRESS_DATA === 'undefined') {
      showErrorBanner('data.js が読み込まれていません。同フォルダに data.js を配置してください。');
      el('phase-list').innerHTML = '<p class="empty-message">data.js がありません</p>';
      ['tbody-completed', 'tbody-partial', 'tbody-not-started'].forEach(function (id) {
        var tb = el(id);
        if (tb) tb.innerHTML = '<tr><td colspan="13" class="empty-message">データなし</td></tr>';
      });
      el('issues-list').innerHTML = '<p class="empty-message">データなし</p>';
      return;
    }

    var d = window.PROGRESS_DATA;
    state.data = d;

    buildPromptShareCount(d.categories || []);
    renderHeader(d.meta || {});
    renderStats(d.stats || {}, (d.categories || []).length, d.unresolved_issues || []);
    renderPhases(d.phases || []);
    initSortHeaders();
    initFilters();
    initSectionToggles();
    applyFilters();
    renderIssues(d.unresolved_issues || []);
  }

  /* Run after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
