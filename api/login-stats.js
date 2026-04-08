export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/login_events?select=event_type,line_user_id,created_at&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const events = await r.json();

    const clicks = events.filter(e => e.event_type === 'click');
    const successes = events.filter(e => e.event_type === 'login_success');
    const uniqueUsers = new Set(successes.map(e => e.line_user_id).filter(Boolean));

    const today = new Date().toLocaleDateString('en-CA');
    const todayClicks = clicks.filter(e => e.created_at.startsWith(today));
    const todaySuccesses = successes.filter(e => e.created_at.startsWith(today));
    const todayUnique = new Set(todaySuccesses.map(e => e.line_user_id).filter(Boolean));

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toLocaleDateString('en-CA');
      trend.push({
        date: ds,
        clicks: clicks.filter(e => e.created_at.startsWith(ds)).length,
        logins: new Set(
          successes.filter(e => e.created_at.startsWith(ds))
            .map(e => e.line_user_id).filter(Boolean)
        ).size
      });
    }

    return res.status(200).json({
      total: {
        clicks: clicks.length,
        logins: successes.length,
        unique_users: uniqueUsers.size,
        conversion_rate: clicks.length
          ? ((uniqueUsers.size / clicks.length) * 100).toFixed(1) + '%'
          : '0%'
      },
      today: {
        clicks: todayClicks.length,
        logins: todaySuccesses.length,
        unique_users: todayUnique.size
      },
      trend
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}