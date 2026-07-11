import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProbabilityHistogramProps {
  counts: Record<string, number>;
}

export default function ProbabilityHistogram({ counts }: ProbabilityHistogramProps) {
  if (!counts || Object.keys(counts).length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No data to display. Run a simulation first!</div>;
  }

  // Convert raw counts into an array of probabilities
  const totalShots = Object.values(counts).reduce((a, b) => a + b, 0);
  
  const data = Object.keys(counts).map(state => {
    const probability = counts[state] / totalShots;
    return {
      state: `|${state}⟩`,
      probability: parseFloat(probability.toFixed(3)),
      count: counts[state]
    };
  }).sort((a, b) => a.state.localeCompare(b.state)); // Sort states alphabetically (e.g. |00> before |01>)

  return (
    <div style={{ width: '100%', height: '300px', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center', color: 'var(--primary-color)' }}>Measurement Probabilities</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="state" 
            stroke="#ccc" 
            tick={{ fill: '#ccc', fontSize: 14 }} 
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            stroke="#ccc" 
            tick={{ fill: '#ccc' }} 
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            domain={[0, 1]}
            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
            formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, 'Probability']}
          />
          <Bar dataKey="probability" radius={[4, 4, 0, 0]} animationDuration={1500}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
            ))}
          </Bar>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
