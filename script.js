/* ============================================================
   REDIX DASHBOARD V1.0 — script.js
   All interactive behaviour for the dashboard.
   Loaded at the bottom of index.html so all HTML exists first.
   ============================================================ */


/* ============================================================
   SECTION 2 — TIME RANGE SELECTOR
   §2.1.1.1 — only one pill active at a time
   §2.1.4   — chosen range saved in localStorage so it persists
              the next time the user logs in
   ============================================================ */

/**
 * Called when a time range pill is clicked.
 * @param {HTMLButtonElement} btn - the pill that was clicked
 */
function pickRange(btn) {
  /* Remove 'active' from every pill in the top bar */
  document.querySelectorAll('.timebar .pill')
          .forEach(p => p.classList.remove('active'));

  /* Make the clicked pill active */
  btn.classList.add('active');

  /* Save the label text to localStorage — persists on next login */
  localStorage.setItem('redix_range', btn.textContent.trim());
}

/* On page load: restore the user's previously saved range */
(function restoreRange() {
  const saved = localStorage.getItem('redix_range');
  if (!saved) return;
  document.querySelectorAll('.timebar .pill').forEach(function(p) {
    /* Toggle active on the pill whose text matches the saved value */
    p.classList.toggle('active', p.textContent.trim() === saved);
  });
})();


/* ============================================================
   MODAL — DETAIL POP-UP
   §3.1.4  — launched from Customer cards
   §3.2.4  — launched from Workshop cards
   §3.1.4.1.1 — shows a bar chart
   §3.1.4.1.2 — shows individual metric stats
   §2.1.3     — modal has its own time range picker
   ============================================================ */

/**
 * Mock detail data for each card type.
 * In production: replace these objects with real API responses.
 *
 * Each entry has:
 *   bars  — array of heights (%) for the bar chart
 *   stats — array of {l: label, v: value} for the metric grid
 */
var DETAIL = {

  /* §3.1.1 Retail */
  retail: {
    bars:  [55, 70, 62, 85, 78, 100],
    stats: [
      { l: 'Total Customers',  v: '3,842'    },
      { l: 'Total Sales',      v: '$148,320' },
      { l: 'Avg Order Value',  v: '$38.60'   },
      { l: 'New This Period',  v: '420'      },
      { l: 'Repeat Rate',      v: '78%'      },
      { l: 'Churn Rate',       v: '4.2%'     }
    ]
  },

  /* §3.1.2 Trade */
  trade: {
    bars:  [80, 65, 70, 55, 60, 50],
    stats: [
      { l: 'Total Customers',  v: '1,205'   },
      { l: 'Total Sales',      v: '$89,740' },
      { l: 'Avg Order Value',  v: '$74.42'  },
      { l: 'On Credit Terms',  v: '61%'     },
      { l: 'Overdue Accounts', v: '8%'      }
    ]
  },

  /* §3.1.3 Wholesale */
  wholesale: {
    bars:  [50, 60, 72, 78, 88, 100],
    stats: [
      { l: 'Total Customers',  v: '672'      },
      { l: 'Total Sales',      v: '$214,900' },
      { l: 'Avg Order Value',  v: '$319.79'  },
      { l: 'Account Managed',  v: '88%'      },
      { l: 'Avg Units/Order',  v: '124'      }
    ]
  },

  /* §3.2.1 Total Workshops */
  'wk-total': {
    bars:  [60, 75, 65, 80, 70, 85],
    stats: [
      { l: 'Total Workshops',  v: '184'      },
      { l: 'Total Sales',      v: '$42,800'  },
      { l: 'Avg Booking Val',  v: '$232.61'  },
      { l: 'Upcoming',         v: '41'       },
      { l: 'Repeat Rate',      v: '55%'      }
    ]
  },

  /* §3.2.2 Workshops that placed orders */
  'wk-orders': {
    bars:  [40, 55, 60, 70, 75, 90],
    stats: [
      { l: 'Orders Placed',   v: '97'      },
      { l: 'Total Value',     v: '$31,450' },
      { l: 'Avg / Workshop',  v: '$324'    },
      { l: '% of All WS',     v: '52.7%'   }
    ]
  },

  /* §3.2.3 Workshops — orders in past 30 days */
  'wk-30d': {
    bars:  [50, 60, 70, 80, 90, 100],
    stats: [
      { l: 'Orders This Month', v: '34'     },
      { l: 'Revenue',           v: '$9,200' },
      { l: 'MoM Growth',        v: '+21%'   },
      { l: 'New Workshops',     v: '7'      }
    ]
  }

};


/**
 * Opens the modal and populates it with data for the given card.
 * Called by onclick on each expand button (⊕).
 *
 * @param {string} title - heading text to show in the modal
 * @param {string} type  - key into the DETAIL object above
 */
function openModal(title, type) {

  /* ── Set the modal heading ── */
  document.getElementById('modal-title').textContent = title;

  /* ── Build the time range pills inside the modal ──
     §2.1.3: the pop-up has its own time range selector
     so the user can tailor results just for this view    */
  var tb = document.getElementById('modal-timebar');
  /* Clear previous pills first */
  tb.innerHTML = '<span style="font-size:.68rem;font-weight:700;color:#9ca3af;letter-spacing:1px;margin-right:4px">RANGE</span>';

  var ranges = ['1yr', '6mo', '3mo', '1mo'];
  ranges.forEach(function(r, i) {
    var btn = document.createElement('button');
    btn.className = 'pill' + (i === 0 ? ' active' : ''); /* first pill starts active */
    btn.textContent = r;
    /* Clicking a modal pill switches it active */
    btn.onclick = function() {
      tb.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
    };
    tb.appendChild(btn);
  });

  /* ── Build the bar chart (§3.1.4.1.1) ── */
  var data    = DETAIL[type] || DETAIL.retail; /* fallback to retail if type not found */
  var chartEl = document.getElementById('modal-chart');
  chartEl.innerHTML = ''; /* clear previous bars */

  data.bars.forEach(function(height) {
    var bar = document.createElement('div');
    bar.className = 'modal-bar';
    bar.style.height = height + '%';
    chartEl.appendChild(bar);
  });

  /* ── Build the stat cards (§3.1.4.1.2) ── */
  var statsEl = document.getElementById('modal-stats');
  statsEl.innerHTML = data.stats.map(function(s) {
    return (
      '<div class="modal-stat">' +
        '<div class="ms-label">' + s.l + '</div>' +
        '<div class="ms-value">' + s.v + '</div>' +
      '</div>'
    );
  }).join('');

  /* ── Show the modal overlay ── */
  document.getElementById('modal').classList.add('open');
}


/**
 * Closes the modal.
 * Called by the ✕ button, Escape key, or clicking the backdrop.
 */
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}


/* Close the modal when clicking the dark backdrop (outside the box) */
document.getElementById('modal').addEventListener('click', function(e) {
  /* e.target is the backdrop itself, not the inner box */
  if (e.target === this) {
    closeModal();
  }
});


/* Close the modal when the user presses the Escape key */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});