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
    shared:         { icon: '🔗', label: '共有',    cls: 'shared' }
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
  function renderStats(stats, total) {
    var tot = stats.total_categories || total || 0;
    var started = stats.phase_1b_started || 0;
    var completed = stats.phase_1b_fully_completed || 0;
    var issues = stats.unresolved_issues_count || 0;

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
    renderStats(d.stats || {}, (d.categories || []).length);
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
