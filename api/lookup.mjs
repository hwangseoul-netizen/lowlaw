const CL = 'https://www.courtlistener.com/api/rest/v4/search/';
const clean = s => (typeof s === 'string' ? s.trim() : '');
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = clean((req.query && req.query.q) || '');
  const type = (req.query && req.query.type) === 'o' ? 'o' : 'r';
  const sort = (req.query && req.query.sort) === 'date' ? 'date' : 'relevance';
  const order = sort === 'date' ? 'dateFiled desc' : 'score desc';
  if (q.length < 2) return res.status(400).json({ error: 'Give me at least two characters.' });
  const url = CL + '?q=' + encodeURIComponent(q) + '&type=' + type + '&order_by=' + encodeURIComponent(order) + '&page_size=20';
  const headers = { accept: 'application/json', 'user-agent': 'LOWLAW/0.1 (lowlaws.com)' };
  if (process.env.COURTLISTENER_TOKEN) headers.authorization = 'Token ' + process.env.COURTLISTENER_TOKEN;
  let r, data;
  try {
    r = await fetch(url, { headers });
    if (r.status === 429) return res.status(429).json({ error: 'The public court API is rate-limiting us right now. Try again in a minute.' });
    if (!r.ok) return res.status(502).json({ error: 'The public court record service returned ' + r.status + '.' });
    data = await r.json();
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the public court record service.' });
  }
  const results = (data.results || []).map(d => ({
    case_name: d.caseName || '',
    court: d.court || '',
    court_id: d.court_id || '',
    court_short: d.court_citation_string || '',
    docket_number: d.docketNumber || '',
    date_filed: d.dateFiled || null,
    date_terminated: d.dateTerminated || null,
    status: d.dateTerminated ? 'Terminated' : 'Open',
    judge: d.assignedTo || null,
    parties: d.party || [],
    attorneys: d.attorney || [],
    firms: d.firm || [],
    nature_of_suit: d.suitNature || '',
    cause: d.cause || '',
    jurisdiction: d.jurisdictionType || '',
    bankruptcy_chapter: d.chapter || null,
    source_url: d.docket_absolute_url ? 'https://www.courtlistener.com' + d.docket_absolute_url : null
  }));
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({
    query: q,
    sort: sort,
    scope: 'United States - all jurisdictions carried by CourtListener/RECAP',
    total_matches: data.count || 0,
    returned: results.length,
    results,
    source: 'CourtListener / RECAP (Free Law Project)',
    means: 'These are public court records. Presence in this list is not an accusation, a judgment, or a finding of any kind. LOWLAW does not interpret them and does not give legal advice.'
  });
}
